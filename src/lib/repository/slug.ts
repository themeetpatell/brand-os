import { nanoid } from 'nanoid'

export type IdGenerator = () => string

export function makeSlug(handle: string, idGen: IdGenerator = () => nanoid(6)): string {
  const base = handle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base}-${idGen()}`
}
