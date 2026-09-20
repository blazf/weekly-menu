/** Recipe `servings` is free text — "4", "6-8", "makes 12", "1 torta".
 *  Only prefix "serves" when the value reads like a count of people. */
export function servingsLabel(servings: string): string {
  const s = servings.trim();
  if (!s) return "";
  return /^\d/.test(s) ? `serves ${s}` : s;
}
