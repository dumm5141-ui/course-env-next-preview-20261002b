import { PercentageDiscountPolicy } from "./src/policy.ts";

const policy = new PercentageDiscountPolicy(10);
console.log("Discounted total:", policy.applyDiscount(100));
