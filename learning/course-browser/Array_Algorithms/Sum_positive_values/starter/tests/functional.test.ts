import { solve } from "../src/solve.ts";

if (solve([3, -2, 4, 0]) !== 7) throw new Error("expected 7");
console.log("PASS");
if (solve([]) !== 0 || solve([-1, -2]) !== 0) throw new Error("Empty/negative boundary failed");
