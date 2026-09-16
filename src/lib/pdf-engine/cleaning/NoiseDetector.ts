export class NoiseDetector {
    sanitize(
      input:
        string
    ): string {
      return input
        .replace(
          /[ ]{2,}/g,
          " "
        )
        .trim();
    }
  
    isNoise(
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
  
      /*
       * Caracteres privados sin
       * contenido textual reconocible.
       */
      if (
        /^[\uE000-\uF8FF]+$/.test(
          text
        )
      ) {
        return true;
      }
  
      /*
       * Secuencias visuales utilizadas
       * como separadores.
       */
      if (
        /^[_=~]{3,}$/.test(
          text
        )
      ) {
        return true;
      }
  
      /*
       * Marcadores explícitos de página.
       */
      if (
        /^(?:page|página)\s+\d+(?:\s*(?:of|de|\/)\s*\d+)?$/i.test(
          text
        )
      ) {
        return true;
      }
  
      /*
       * Símbolos sueltos que no aportan
       * contenido.
       *
       * No incluimos "•" porque una
       * viñeta sola podría formar parte
       * de un PDF extraño y preferimos
       * no ser agresivos.
       */
      if (
        /^[|\\/_=~]{1,4}$/.test(
          text
        )
      ) {
        return true;
      }
  
      return false;
    }
  }