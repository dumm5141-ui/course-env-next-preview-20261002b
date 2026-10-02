export interface DiscountPolicy {
  applyDiscount(subtotal: number): number;
}

export class PercentageDiscountPolicy implements DiscountPolicy {
  private readonly percentage: number;

  constructor(percentage: number) {
    if (percentage < 0 || percentage > 100) {
      throw new Error("Invalid percentage");
    }
    this.percentage = percentage;
  }

  applyDiscount(subtotal: number): number {
    const discount = (subtotal * this.percentage) / 100;
    return Math.max(0, subtotal - discount);
  }
}

export class FlatDiscountPolicy implements DiscountPolicy {
  private readonly amount: number;

  constructor(amount: number) {
    if (amount < 0) {
      throw new Error("Invalid amount");
    }
    this.amount = amount;
  }

  applyDiscount(subtotal: number): number {
    return Math.max(0, subtotal - this.amount);
  }
}
