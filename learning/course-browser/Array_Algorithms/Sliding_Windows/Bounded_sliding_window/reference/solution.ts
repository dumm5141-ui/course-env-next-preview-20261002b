export function maxWindow(values, k) {
  if (!Number.isInteger(k) || k < 1 || k > values.length) throw new Error("Invalid window");
  let sum = 0;
  for (let i = 0; i < k; i++) sum += values[i];
  let best = sum;
  for (let i = k; i < values.length; i++) {
    sum += values[i] - values[i - k];
    best = Math.max(best, sum);
  }
  return best;
}
