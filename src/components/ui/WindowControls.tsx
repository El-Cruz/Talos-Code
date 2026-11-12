export function WindowControls() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <span className="h-2.5 w-2.5 rounded-full bg-flare/80" />
      <span className="h-2.5 w-2.5 rounded-full bg-grid" />
      <span className="h-2.5 w-2.5 rounded-full bg-beam/80" />
    </div>
  );
}