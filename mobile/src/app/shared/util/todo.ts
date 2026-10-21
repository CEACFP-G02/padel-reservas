/** Marks a not-yet-implemented use case; `anchor` is the docs/api.md section that specifies it. */
export function todo(what: string, anchor: string): never {
  throw new Error(`TODO: ${what} — see docs/api.md#${anchor}`);
}
