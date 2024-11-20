export const wrapInQuotes = (str: string) =>
  str
    .split('.')
    .map((s) => `"${s}"`)
    .join('.');
