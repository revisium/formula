function isList(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export const BUILTIN_FUNCTIONS: Record<
  string,
  (...args: unknown[]) => unknown
> = {
  // Logical
  and: (a, b) => Boolean(a) && Boolean(b),
  or: (a, b) => Boolean(a) || Boolean(b),
  not: (a) => !a,

  // String
  concat: (...args) => args.map(String).join(''),
  upper: (s) => String(s).toUpperCase(),
  lower: (s) => String(s).toLowerCase(),
  trim: (s) => String(s).trim(),
  left: (s, n) => String(s).slice(0, Math.max(0, Math.floor(Number(n)))),
  right: (s, n) => {
    const str = String(s);
    const count = Math.max(0, Math.floor(Number(n)));
    return count === 0 ? '' : str.slice(-count);
  },
  replace: (s, search, repl) => String(s).replace(String(search), String(repl)),
  tostring: String,
  length: (s) => {
    if (Array.isArray(s)) return s.length;
    if (typeof s === 'string') return s.length;
    if (s !== null && typeof s === 'object') return Object.keys(s).length;
    return String(s).length;
  },
  contains: (s, search) => String(s).includes(String(search)),
  startswith: (s, search) => String(s).startsWith(String(search)),
  endswith: (s, search) => String(s).endsWith(String(search)),
  join: (arr: unknown, sep: unknown) => {
    if (!Array.isArray(arr)) return '';
    if (sep === undefined || sep === null) return arr.join(',');
    if (typeof sep !== 'string' && typeof sep !== 'number') {
      return arr.join(',');
    }
    return arr.join(String(sep));
  },

  // Numeric
  tonumber: Number,
  toboolean: Boolean,
  isnull: (v) => v === null || v === undefined,
  coalesce: (...args) =>
    args.find((v) => v !== null && v !== undefined) ?? null,
  round: (n, dec) => {
    const factor = 10 ** (dec === undefined ? 0 : Number(dec));
    return Math.round(Number(n) * factor) / factor;
  },
  floor: (n) => Math.floor(Number(n)),
  ceil: (n) => Math.ceil(Number(n)),
  abs: (n) => Math.abs(Number(n)),
  sqrt: (n) => Math.sqrt(Number(n)),
  pow: (base, exp) => Math.pow(Number(base), Number(exp)),
  min: (...args) =>
    args.length === 0 ? Number.NaN : Math.min(...args.map(Number)),
  max: (...args) =>
    args.length === 0 ? Number.NaN : Math.max(...args.map(Number)),
  log: (n) => Math.log(Number(n)),
  log10: (n) => Math.log10(Number(n)),
  exp: (n) => Math.exp(Number(n)),
  sign: (n) => Math.sign(Number(n)),

  // Array
  sum: (arr) =>
    isList(arr) ? arr.reduce<number>((a, b) => a + Number(b), 0) : 0,
  avg: (arr) =>
    isList(arr) && arr.length > 0
      ? arr.reduce<number>((a, b) => a + Number(b), 0) / arr.length
      : 0,
  count: (arr) => (isList(arr) ? arr.length : 0),
  first: (arr) => (isList(arr) ? arr[0] : undefined),
  last: (arr) => (isList(arr) ? arr.at(-1) : undefined),
  includes: (arr, val) => (isList(arr) ? arr.includes(val) : false),

  // Conditional
  if: (cond, ifTrue, ifFalse) => (cond ? ifTrue : ifFalse),
};
