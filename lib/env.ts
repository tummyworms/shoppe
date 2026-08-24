// Read environment variables at true runtime via globalThis, so the bundler
// doesn't substitute or embed values at build time. These are only ever read
// in server code (never shipped to the browser).
export function getEnv(name: string): string | undefined {
  return globalThis.process?.env?.[name];
}
