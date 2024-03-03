export function asHexArray(bytes: number[]) {
  return bytes.map(b => b.toString(16).padStart(2, '0'))
}
