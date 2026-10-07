export function concatClassNames(
  ...names: (string | false | null | undefined)[]
): string {
  return names.filter(Boolean).join(" ");
}
