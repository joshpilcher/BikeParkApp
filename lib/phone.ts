/** Normalise AU mobiles for storage in patrons.mobile_e164 */
export function normalizeAuMobile(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("04")) return `+61${trimmed.slice(1)}`;
  if (trimmed.startsWith("61") && trimmed.length >= 11) return `+${trimmed}`;
  return trimmed;
}
