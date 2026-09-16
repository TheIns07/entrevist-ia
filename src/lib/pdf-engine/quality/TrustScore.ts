export interface WeightedScore {
    value: number;
  
    weight: number;
  }
  
  export class TrustScore {
    static calculate(
      scores:
        WeightedScore[]
    ): number {
      if (
        scores.length ===
        0
      ) {
        return 0;
      }
  
      let weightedTotal =
        0;
  
      let totalWeight =
        0;
  
      for (
        const score of
          scores
      ) {
        const weight =
          Math.max(
            0,
            score.weight
          );
  
        weightedTotal +=
          TrustScore.clamp(
            score.value
          ) *
          weight;
  
        totalWeight +=
          weight;
      }
  
      if (
        totalWeight <=
        0
      ) {
        return 0;
      }
  
      return TrustScore.clamp(
        weightedTotal /
        totalWeight
      );
    }
  
    static clamp(
      value:
        number
    ): number {
      return Math.max(
        0,
        Math.min(
          1,
          value
        )
      );
    }
  }