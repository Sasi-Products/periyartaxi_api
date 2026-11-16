export const normalizedPhone = value => String(value || '').replace(/\D/g, '');
export function sameMobile(a, b) {
  const first = normalizedPhone(a), second = normalizedPhone(b);
  return !!first && !!second && (
    first === second ||
    (first.length === 10 && second === `91${first}`) ||
    (second.length === 10 && first === `91${second}`)
  );
}
export function phoneVariants(value) {
  const digits = normalizedPhone(value);
  if (!digits) return [];
  const variants = [String(value).replace(/\s/g, '')];
  if (digits.length === 10) variants.push(`+91${digits}`, `91${digits}`);
  if (digits.length === 12 && digits.startsWith('91')) variants.push(digits.slice(2), digits, `+${digits}`);
  return [...new Set(variants)];
}
