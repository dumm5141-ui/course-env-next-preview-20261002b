export interface DiscountPolicy {
  applyDiscount(subtotal: number): number;
}

export class PercentageDiscountPolicy implements DiscountPolicy {
  readonly percentage: number;

  constructor(percentage: number) {
    if (percentage < 0 || percentage > 100) {
      throw new Error("Invalid percentage");
    }
    this.percentage = percentage;
  }

  applyDiscount(subtotal: number): number {
    // TODO: implement percentage discount
    return subtotal;
  }
}

export class FlatDiscountPolicy implements DiscountPolicy {
  readonly amount: number;

  constructor(amount: number) {
    if (amount < 0) {
      throw new Error("Invalid amount");
    }
    this.amount = amount;
  }

  applyDiscount(subtotal: number): number {
    // TODO: implement flat discount
    return subtotal;
  }
}
