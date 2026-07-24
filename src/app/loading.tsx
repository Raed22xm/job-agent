export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse p-4">
      <div className="h-8 w-1/3 rounded-xl bg-surface-border" />
      <div className="h-32 w-full rounded-2xl bg-surface-border" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-28 rounded-xl bg-surface-border" />
        <div className="h-28 rounded-xl bg-surface-border" />
      </div>
    </div>
  );
}
