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
    <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
      <h2 className="text-lg font-semibold text-rose-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-rose-800">
        {isChunkLoadError(error)
          ? "The app was updated while this page was open. Reloading should fix it."
          : error.message || "An unexpected error occurred."}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Reload page
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
