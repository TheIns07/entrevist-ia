import {
    BinaryReader,
  } from "../binary/BinaryReader";
  
  import {
    PdfLexer,
  } from "../parser/PdfLexer";
  
  import {
    PdfObjectParser,
  } from "../parser/PdfObjectParser";
  
  import type {
    PdfObject,
  } from "../types";
  
  export interface PdfContentOperation {
    operator:
      string;
  
    operands:
      PdfObject[];
  
    offset:
      number;
  }
  
  export class ContentStreamParser {
    static parse(
      bytes: Uint8Array
    ): PdfContentOperation[] {
      const reader =
        new BinaryReader(
          bytes
        );
  
      const lexer =
        new PdfLexer(
          reader
        );
  
      const objectParser =
        new PdfObjectParser(
          lexer
        );
  
      const operations:
        PdfContentOperation[] =
          [];
  
      const operands:
        PdfObject[] = [];
  
      let iterations =
        0;
  
      const maxIterations =
        Math.max(
          10_000,
          bytes.length *
            5
        );
  
      while (true) {
        iterations += 1;
  
        if (
          iterations >
          maxIterations
        ) {
          throw new Error(
            "Content stream parser exceeded its safety iteration limit."
          );
        }
  
        const start =
          lexer.position;
  
        const token =
          lexer.nextToken();
  
        if (
          token.type ===
          "eof"
        ) {
          break;
        }
  
        if (
          token.type ===
          "keyword"
        ) {
          const keyword =
            token.value as string;
  
          /*
           * true/false/null son
           * objetos, no operadores.
           */
          if (
            keyword ===
              "true" ||
            keyword ===
              "false" ||
            keyword ===
              "null"
          ) {
            lexer.position =
              start;
  
            operands.push(
              objectParser.parseValue()
            );
  
            continue;
          }
  
          operations.push({
            operator:
              keyword,
  
            operands: [
              ...operands,
            ],
  
            offset:
              start,
          });
  
          operands.length =
            0;
  
          continue;
        }
  
        lexer.position =
          start;
  
        const value =
          objectParser.parseValue();
  
        operands.push(
          value
        );
  
        if (
          lexer.position <=
          start
        ) {
          lexer.position =
            Math.min(
              bytes.length,
              start + 1
            );
        }
      }
  
      return operations;
    }
  }