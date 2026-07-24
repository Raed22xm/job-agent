export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[JobAgent] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[JobAgent] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[JobAgent] ${message}`, ...args);
  },
};
