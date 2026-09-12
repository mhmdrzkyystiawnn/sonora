type Level = "info" | "warn" | "error";

function write(level: Level, message: string, meta?: unknown): void {
  const entry = JSON.stringify({
    level,
    message,
    time: new Date().toISOString(),
    ...(meta !== undefined ? { meta } : {}),
  });

  if (level === "error") {
    console.error(entry);
  } else if (level === "warn") {
    console.warn(entry);
  } else {
    console.log(entry);
  }
}

export const logger = {
  info: (message: string, meta?: unknown) => write("info", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  error: (message: string, meta?: unknown) => write("error", message, meta),
};