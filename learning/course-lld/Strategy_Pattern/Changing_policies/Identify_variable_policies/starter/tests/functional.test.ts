import assert from "node:assert/strict";
import { FlatDiscountPolicy, PercentageDiscountPolicy } from "../src/policy.ts";

const percentPolicy = new PercentageDiscountPolicy(20);
assert.equal(percentPolicy.applyDiscount(100), 80, "Percentage discount should deduct 20%");

const flatPolicy = new FlatDiscountPolicy(15);
assert.equal(flatPolicy.applyDiscount(100), 85, "Flat discount should deduct 15");

assert.equal(flatPolicy.applyDiscount(10), 0, "Flat discount should not drop below zero");

console.log("PASS");
