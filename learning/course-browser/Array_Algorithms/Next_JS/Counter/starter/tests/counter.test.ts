import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const content = readFileSync("app/counter.tsx", "utf8");

// Must be a client component to use React state hooks
assert(
  content.includes("'use client'") || content.includes('"use client"'),
  "counter.tsx must include 'use client' directive at the top",
);

// Must use React useState hook
assert(content.includes("useState"), "counter.tsx must use useState hook to manage counter state");

// Must have an interactive click handler
assert(
  content.includes("onClick"),
  "counter.tsx button must have an onClick handler to increment count",
);

console.log("PASS: Next.js counter component implementation validated.");
