import { Link as ViteLink } from "react-router-dom";

export const Link = (p: {
  href: string;
  children: React.ReactNode;
  className?: React.ComponentProps<typeof ViteLink>["className"];
}) => {
  return (
    <ViteLink
      to={p.href}
      className={`decoration-muted-foreground hover:decoration-primary underline hover:underline-offset-2 ${p.className}`}
    >
      {p.children}
    </ViteLink>
  );
};
