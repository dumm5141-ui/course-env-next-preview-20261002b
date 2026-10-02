import { maxWindow } from "../src/window.ts";

if (maxWindow([1, 4, 2, 7], 2) !== 9) throw new Error("Expected 9");
let rejected = false;
try {
  maxWindow([1], 0);
} catch {
  rejected = true;
}
if (!rejected) throw new Error("Reject invalid windows");
console.log("PASS");
