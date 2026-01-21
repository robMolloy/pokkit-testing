export function HeaderTemplate(p: {
  Left: React.ReactNode;
  Right: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="flex h-14 flex-1 items-center justify-between px-6">
        <span className="flex-1">{p.Left}</span>

        <span>{p.children}</span>

        <span className="flex flex-1 justify-end">
          <span>{p.Right}</span>
        </span>
      </div>
    </header>
  );
}
