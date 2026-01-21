export const CenteredItemTemplate = (p: { children: React.ReactNode }) => {
  return (
    <div className="mt-4 flex justify-center px-4 md:mt-16">
      <div className="w-[420px] max-w-full">{p.children}</div>
    </div>
  );
};
