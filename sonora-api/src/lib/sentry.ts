// Sentry tidak didukung di Deno Deploy — no-op stub
export function initSentry(): void {}

export function captureError(_error: unknown): void {}
