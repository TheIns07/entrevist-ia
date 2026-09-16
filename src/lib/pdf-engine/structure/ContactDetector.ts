export interface ContactTextLine {
    text:
      string;
  
    lineIndex:
      number;
  }
  
  export interface ContactSplitResult {
    headerLines:
      ContactTextLine[];
  
    contactLines:
      ContactTextLine[];
  }
  
  export class ContactDetector {
    splitPreamble(
      lines:
        string[],
  
      startLine:
        number = 0
    ): ContactSplitResult {
      const headerLines:
        ContactTextLine[] = [];
  
      const contactLines:
        ContactTextLine[] = [];
  
      for (
        let index = 0;
        index <
        lines.length;
        index += 1
      ) {
        const text =
          (
            lines[index] ??
            ""
          ).trim();
  
        if (
          text.length ===
          0
        ) {
          continue;
        }
  
        const item:
          ContactTextLine = {
            text,
  
            lineIndex:
              startLine +
              index,
          };
  
        if (
          this.isContactLine(
            text
          )
        ) {
          contactLines.push(
            item
          );
  
          continue;
        }
  
        headerLines.push(
          item
        );
      }
  
      return {
        headerLines,
  
        contactLines,
      };
    }
  
    isContactLine(
      input:
        string
    ): boolean {
      const text =
        input.trim();
  
      if (
        text.length ===
        0
      ) {
        return false;
      }
  
      if (
        containsEmail(
          text
        )
      ) {
        return true;
      }
  
      if (
        containsPhone(
          text
        )
      ) {
        return true;
      }
  
      if (
        containsUrl(
          text
        )
      ) {
        return true;
      }
  
      if (
        containsContactLabel(
          text
        )
      ) {
        return true;
      }
  
      return false;
    }
  }
  
  function containsEmail(
    text:
      string
  ): boolean {
    return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(
      text
    );
  }
  
  function containsPhone(
    text:
      string
  ): boolean {
    const candidates =
      text.match(
        /\+?\d[\d\s().-]{6,}\d/g
      ) ??
      [];
  
    for (
      const candidate of
        candidates
    ) {
      const digits =
        candidate.replace(
          /\D/g,
          ""
        );
  
      if (
        digits.length >=
          7 &&
        digits.length <=
          15
      ) {
        return true;
      }
    }
  
    return false;
  }
  
  function containsUrl(
    text:
      string
  ): boolean {
    return (
      /\bhttps?:\/\/\S+/i.test(
        text
      ) ||
      /\bwww\.\S+/i.test(
        text
      ) ||
      /\blinkedin\.com\/\S+/i.test(
        text
      ) ||
      /\bgithub\.com\/\S+/i.test(
        text
      )
    );
  }
  
  function containsContactLabel(
    text:
      string
  ): boolean {
    return /(?:^|[\s|•·])(?:e-?mail|email|correo(?: electrónico)?|tel(?:éfono|ephone)?|phone|mobile|móvil|cel(?:ular)?|linkedin|github|portfolio|portafolio|website|web|location|ubicación|address|dirección)\s*:/i.test(
      text
    );
  }