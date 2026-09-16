import {
    PdfEngineError,
  } from "../errors";
  
  import {
    bytesToLatin1,
  } from "./ByteUtils";
  
  export class BinaryReader {
    private readonly bytes:
      Uint8Array;
  
    private cursor = 0;
  
    constructor(
      source:
        | ArrayBuffer
        | Uint8Array
    ) {
      this.bytes =
        source instanceof
        Uint8Array
          ? source
          : new Uint8Array(
              source
            );
    }
  
    get length(): number {
      return (
        this.bytes.length
      );
    }
  
    get position(): number {
      return this.cursor;
    }
  
    get eof(): boolean {
      return (
        this.cursor >=
        this.bytes.length
      );
    }
  
    get data(): Uint8Array {
      return this.bytes;
    }
  
    seek(
      position: number
    ): void {
      if (
        !Number.isInteger(
          position
        ) ||
        position < 0 ||
        position >
          this.bytes.length
      ) {
        throw new PdfEngineError(
          "INVALID_PDF",
  
          `Invalid PDF byte offset: ${position}.`,
  
          {
            offset:
              position,
          }
        );
      }
  
      this.cursor =
        position;
    }
  
    skip(
      length: number
    ): void {
      this.seek(
        this.cursor +
          length
      );
    }
  
    peekByte(
      relativeOffset = 0
    ): number | undefined {
      const index =
        this.cursor +
        relativeOffset;
  
      if (
        index < 0 ||
        index >=
          this.bytes.length
      ) {
        return undefined;
      }
  
      return this.bytes[
        index
      ];
    }
  
    readByte(): number {
      if (this.eof) {
        throw new PdfEngineError(
          "INVALID_PDF",
  
          "Unexpected end of PDF data.",
  
          {
            offset:
              this.cursor,
          }
        );
      }
  
      const value =
        this.bytes[
          this.cursor
        ];
  
      this.cursor += 1;
  
      return value;
    }
  
    readBytes(
      length: number
    ): Uint8Array {
      if (
        !Number.isInteger(
          length
        ) ||
        length < 0
      ) {
        throw new PdfEngineError(
          "INVALID_PDF",
  
          `Invalid byte length: ${length}.`,
  
          {
            offset:
              this.cursor,
          }
        );
      }
  
      const end =
        this.cursor +
        length;
  
      if (
        end >
        this.bytes.length
      ) {
        throw new PdfEngineError(
          "INVALID_PDF",
  
          "Unexpected end of PDF while reading bytes.",
  
          {
            offset:
              this.cursor,
  
            details: {
              requestedLength:
                length,
  
              available:
                this.bytes
                  .length -
                this.cursor,
            },
          }
        );
      }
  
      const value =
        this.bytes.subarray(
          this.cursor,
          end
        );
  
      this.cursor =
        end;
  
      return value;
    }
  
    readAscii(
      length: number
    ): string {
      return bytesToLatin1(
        this.readBytes(
          length
        )
      );
    }
  
    slice(
      start: number,
  
      end: number
    ): Uint8Array {
      if (
        start < 0 ||
        end < start ||
        end >
          this.bytes.length
      ) {
        throw new PdfEngineError(
          "INVALID_PDF",
  
          "Invalid PDF byte slice.",
  
          {
            offset:
              start,
  
            details: {
              start,
  
              end,
  
              byteLength:
                this.bytes
                  .length,
            },
          }
        );
      }
  
      return this.bytes.subarray(
        start,
        end
      );
    }
  }