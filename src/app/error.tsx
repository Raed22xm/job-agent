"use client";

import { useEffect } from "react";

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === "ChunkLoadError" ||
    error.message.includes("Loading chunk") ||
    error.message.includes("Failed to fetch dynamically imported module")
  );
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (isChunkLoadError(error)) {
      window.location.reload();
    }
  }, [error]);

  return (
    <div
      className="mx-auto max-w-lg glass-panel rounded-2xl p-6 text-center"
      style={{
        borderColor: "rgba(239, 68, 68, 0.2)",
        background: "rgba(239, 68, 68, 0.05)",
      }}
    >
      <h2 className="text-lg font-semibold" style={{ color: "var(--danger)" }}>
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-foreground-secondary">
        {isChunkLoadError(error)
          ? "The app was updated while this page was open. Reloading should fix it."
          : error.message || "An unexpected error occurred."}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Reload page
        </button>
        <button
          type="button"
          onClick={reset}
          className="btn-secondary"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
