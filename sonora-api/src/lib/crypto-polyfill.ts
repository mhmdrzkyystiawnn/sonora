// Polyfill untuk node:crypto → Web Crypto API (Deno compatible)

export function randomBytes(length: number): Uint8Array {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return buffer;
}

export function randomBytesBase64(length: number): string {
  const buffer = randomBytes(length);
  return btoa(String.fromCharCode(...buffer));
}
