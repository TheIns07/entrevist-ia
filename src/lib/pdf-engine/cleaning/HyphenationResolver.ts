export class HyphenationResolver {
    resolve(
      input: string
    ): string {
      return input.replace(
        /([A-Za-zÀ-ÖØ-öø-ÿ]{2,})-\n[ \t]*([A-Za-zÀ-ÖØ-öø-ÿ])/g,
        "$1-$2"
      );
    }
  }