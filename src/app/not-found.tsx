import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg glass-panel my-16 rounded-2xl p-8 text-center animate-fade-in">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
        404
      </div>
      <h1 className="mt-4 text-2xl font-bold text-foreground">Page Not Found</h1>
      <p className="mt-2 text-sm text-foreground-secondary">
        The page or resource you are looking for does not exist or has been moved.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="btn-primary">
          Back to Home
        </Link>
        <Link href="/agent" className="btn-secondary">
          Go to AI Agent
        </Link>
      </div>
    </div>
  );
}
