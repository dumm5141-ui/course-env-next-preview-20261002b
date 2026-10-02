export interface DiscountPolicy {
  applyDiscount(subtotal: number): number;
}

export interface CartItem {
  price: number;
  quantity: number;
}

export class CheckoutWorkflow {
  readonly discountPolicy: DiscountPolicy;

  constructor(discountPolicy: DiscountPolicy) {
    this.discountPolicy = discountPolicy;
  }

  calculateTotal(_items: CartItem[]): number {
    // TODO: calculate subtotal and apply discount policy
    return 0;
  }
}
