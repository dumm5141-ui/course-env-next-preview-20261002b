"use client";
import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      <h2>Count: {count}</h2>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        Increment
      </button>
    </div>
  );
}
