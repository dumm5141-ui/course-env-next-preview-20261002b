export function solve(values) {
  return values.reduce((sum, value) => (value > 0 ? sum + value : sum), 0);
}
