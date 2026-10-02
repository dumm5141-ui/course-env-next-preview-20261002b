import assert from "node:assert/strict";
import { CheckoutWorkflow, type DiscountPolicy } from "../src/checkout.ts";

const mockPolicy: DiscountPolicy = {
  applyDiscount: (subtotal: number) => subtotal * 0.9,
};

const checkout = new CheckoutWorkflow(mockPolicy);
const total = checkout.calculateTotal([
  { price: 50, quantity: 2 },
  { price: 100, quantity: 1 },
]);

assert.equal(total, 180, "Subtotal 200 with 10% discount should equal 180");
console.log("PASS");
