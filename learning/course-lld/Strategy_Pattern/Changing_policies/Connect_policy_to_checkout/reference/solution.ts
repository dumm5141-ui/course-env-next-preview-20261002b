export interface DiscountPolicy {
  applyDiscount(subtotal: number): number;
}

export interface CartItem {
  price: number;
  quantity: number;
}

export class CheckoutWorkflow {
  private readonly discountPolicy: DiscountPolicy;

  constructor(discountPolicy: DiscountPolicy) {
    this.discountPolicy = discountPolicy;
  }

  calculateTotal(items: CartItem[]): number {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return this.discountPolicy.applyDiscount(subtotal);
  }
}
