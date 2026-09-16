import {
  MAX_PAGE_TREE_DEPTH,
} from "../constants";

import {
  PdfEngineError,
} from "../errors";

import type {
  PdfDictionary,
  PdfObject,
  PdfPage,
  PdfPageTreeResult,
  PdfRectangle,
  PdfReference,
  PdfStream,
  PdfWarning,
} from "../types";

import {
  isPdfArray,
  isPdfDictionary,
  isPdfName,
  isPdfReference,
  isPdfStream,
} from "../types";

interface InheritedPageProperties {
  resources?: PdfObject;

  mediaBox?: PdfRectangle;

  cropBox?: PdfRectangle;

  rotate?: number;
}

export class PdfPageTree {
  private readonly warnings:
    PdfWarning[] = [];

  private readonly visited =
    new Set<string>();

  private readonly pages:
    PdfPage[] = [];

  private readonly resolve:
    (
      reference:
        PdfReference
    ) =>
      | PdfObject
      | undefined;

  private readonly onWarning?:
    (
      warning:
        PdfWarning
    ) => void;

  constructor(
    resolve:
      (
        reference:
          PdfReference
      ) =>
        | PdfObject
        | undefined,

    onWarning?:
      (
        warning:
          PdfWarning
      ) => void
  ) {
    this.resolve =
      resolve;

    this.onWarning =
      onWarning;
  }

  parse(
    catalogReference:
      PdfReference
  ): PdfPageTreeResult {
    /*
     * Permitimos reutilizar la instancia
     * sin conservar estado de una
     * ejecución anterior.
     */
    this.warnings.length =
      0;

    this.pages.length =
      0;

    this.visited.clear();

    const catalogObject =
      this.resolve(
        catalogReference
      );

    if (
      !isPdfDictionary(
        catalogObject
      )
    ) {
      throw new PdfEngineError(
        "PAGE_PARSE_FAILED",

        "PDF catalog could not be resolved.",

        {
          objectNumber:
            catalogReference.objectNumber,
        }
      );
    }

    const catalogType =
      catalogObject.entries.get(
        "Type"
      );

    if (
      catalogType !==
        undefined &&
      (
        !isPdfName(
          catalogType
        ) ||
        catalogType.value !==
          "Catalog"
      )
    ) {
      this.warn({
        code:
          "MISSING_CATALOG",

        message:
          "Root object does not declare /Type /Catalog; attempting to continue.",

        objectNumber:
          catalogReference.objectNumber,
      });
    }

    const pagesValue =
      catalogObject.entries.get(
        "Pages"
      );

    if (
      !isPdfReference(
        pagesValue
      )
    ) {
      throw new PdfEngineError(
        "PAGE_PARSE_FAILED",

        "PDF catalog does not contain an indirect /Pages reference.",

        {
          objectNumber:
            catalogReference.objectNumber,
        }
      );
    }

    this.walkNode(
      pagesValue,
      {},
      0
    );

    if (
      this.pages.length ===
      0
    ) {
      this.warn({
        code:
          "MISSING_PAGE_TREE",

        message:
          "The PDF page tree did not produce any pages.",

        objectNumber:
          pagesValue.objectNumber,
      });
    }

    return {
      pages: [
        ...this.pages,
      ],

      warnings: [
        ...this.warnings,
      ],
    };
  }

  private walkNode(
    reference:
      PdfReference,

    inherited:
      InheritedPageProperties,

    depth: number
  ): void {
    if (
      depth >
      MAX_PAGE_TREE_DEPTH
    ) {
      this.warn({
        code:
          "PAGE_TREE_DEPTH_LIMIT",

        message:
          `PDF page tree exceeded the maximum supported depth of ${MAX_PAGE_TREE_DEPTH}.`,

        objectNumber:
          reference.objectNumber,
      });

      return;
    }

    const key =
      `${reference.objectNumber}:${reference.generationNumber}`;

    if (
      this.visited.has(
        key
      )
    ) {
      this.warn({
        code:
          "PAGE_TREE_CYCLE",

        message:
          `Cycle detected in PDF page tree at object ${reference.objectNumber}.`,

        objectNumber:
          reference.objectNumber,
      });

      return;
    }

    this.visited.add(
      key
    );

    const resolved =
      this.resolve(
        reference
      );

    if (
      !isPdfDictionary(
        resolved
      )
    ) {
      this.warn({
        code:
          "MALFORMED_OBJECT",

        message:
          `Page tree object ${reference.objectNumber} is not a dictionary.`,

        objectNumber:
          reference.objectNumber,
      });

      return;
    }

    const type =
      resolved.entries.get(
        "Type"
      );

    if (
      isPdfName(
        type
      ) &&
      type.value ===
        "Page"
    ) {
      this.addPage(
        reference,
        resolved,
        inherited
      );

      return;
    }

    const nextInherited =
      this.mergeInherited(
        resolved,
        inherited
      );

    const kids =
      resolved.entries.get(
        "Kids"
      );

    if (
      !isPdfArray(
        kids
      )
    ) {
      this.warn({
        code:
          "MALFORMED_OBJECT",

        message:
          `Page tree node ${reference.objectNumber} has no valid /Kids array.`,

        objectNumber:
          reference.objectNumber,
      });

      return;
    }

    for (
      const kid of
        kids.items
    ) {
      if (
        !isPdfReference(
          kid
        )
      ) {
        this.warn({
          code:
            "MALFORMED_OBJECT",

          message:
            `Page tree node ${reference.objectNumber} contains a non-reference child.`,

          objectNumber:
            reference.objectNumber,
        });

        continue;
      }

      this.walkNode(
        kid,
        nextInherited,
        depth + 1
      );
    }
  }

  private addPage(
    reference:
      PdfReference,

    dictionary:
      PdfDictionary,

    inherited:
      InheritedPageProperties
  ): void {
    const merged =
      this.mergeInherited(
        dictionary,
        inherited
      );

    const contents =
      this.extractContents(
        dictionary.entries.get(
          "Contents"
        )
      );

    const pageNumber =
      this.pages.length +
      1;

    if (
      contents.length ===
      0
    ) {
      this.warn({
        code:
          "MISSING_PAGE_CONTENTS",

        message:
          `Page ${pageNumber} has no readable /Contents entry.`,

        objectNumber:
          reference.objectNumber,

        page:
          pageNumber,
      });
    }

    if (
      merged.resources ===
      undefined
    ) {
      this.warn({
        code:
          "MISSING_PAGE_RESOURCES",

        message:
          `Page ${pageNumber} has no /Resources entry.`,

        objectNumber:
          reference.objectNumber,

        page:
          pageNumber,
      });
    }

    this.pages.push({
      pageNumber,

      reference,

      dictionary,

      contents,

      resources:
        merged.resources,

      mediaBox:
        merged.mediaBox,

      cropBox:
        merged.cropBox,

      rotate:
        merged.rotate ??
        0,
    });
  }

  private mergeInherited(
    dictionary:
      PdfDictionary,

    parent:
      InheritedPageProperties
  ): InheritedPageProperties {
    const resources =
      dictionary.entries.get(
        "Resources"
      ) ??
      parent.resources;

    const mediaBox =
      this.asRectangle(
        dictionary.entries.get(
          "MediaBox"
        )
      ) ??
      parent.mediaBox;

    const cropBox =
      this.asRectangle(
        dictionary.entries.get(
          "CropBox"
        )
      ) ??
      parent.cropBox;

    const rotateValue =
      dictionary.entries.get(
        "Rotate"
      );

    const rotate =
      typeof rotateValue ===
      "number"
        ? rotateValue
        : parent.rotate;

    return {
      resources,
      mediaBox,
      cropBox,
      rotate,
    };
  }

  private extractContents(
    value:
      | PdfObject
      | undefined
  ): Array<
    PdfReference |
    PdfStream
  > {
    if (
      isPdfReference(
        value
      ) ||
      isPdfStream(
        value
      )
    ) {
      return [
        value,
      ];
    }

    if (
      !isPdfArray(
        value
      )
    ) {
      return [];
    }

    const result:
      Array<
        PdfReference |
        PdfStream
      > = [];

    for (
      const item of
        value.items
    ) {
      if (
        isPdfReference(
          item
        ) ||
        isPdfStream(
          item
        )
      ) {
        result.push(
          item
        );
      }
    }

    return result;
  }

  private asRectangle(
    value:
      | PdfObject
      | undefined
  ):
    | PdfRectangle
    | undefined {
    if (
      !isPdfArray(
        value
      ) ||
      value.items.length <
        4
    ) {
      return undefined;
    }

    const coordinates =
      value.items.slice(
        0,
        4
      );

    if (
      !coordinates.every(
        (
          item
        ): item is number =>
          typeof item ===
          "number"
      )
    ) {
      return undefined;
    }

    return {
      x1:
        coordinates[0],

      y1:
        coordinates[1],

      x2:
        coordinates[2],

      y2:
        coordinates[3],
    };
  }

  /*
   * =========================================================
   * WARNING HANDLING
   * =========================================================
   *
   * Todos los warnings pasan por un único punto.
   *
   * Esto permite:
   *
   * 1. conservarlos dentro de PdfPageTree;
   * 2. devolverlos en PdfPageTreeResult;
   * 3. propagarlos al PdfParser si existe callback;
   * 4. evitar duplicar lógica.
   * =========================================================
   */

  private warn(
    warning:
      PdfWarning
  ): void {
    this.warnings.push(
      warning
    );

    this.onWarning?.(
      warning
    );
  }
}