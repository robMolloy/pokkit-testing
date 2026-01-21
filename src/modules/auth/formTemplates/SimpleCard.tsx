import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const SimpleCard = (p: {
  title?: string;
  description?: string;
  headerChildrenTop?: React.ReactNode;
  headerChildrenBottom?: React.ReactNode;
  footerChildren?: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <Card>
      {(p.title || p.description || p.headerChildrenBottom || p.headerChildrenTop) && (
        <CardHeader>
          {p.headerChildrenTop}
          {p.title && <CardTitle>{p.title}</CardTitle>}
          {p.description && <CardDescription>{p.description}</CardDescription>}
          {p.headerChildrenBottom}
        </CardHeader>
      )}
      <CardContent>{p.children}</CardContent>
      {p.footerChildren && (
        <CardFooter>
          <div>{p.footerChildren}</div>
        </CardFooter>
      )}
    </Card>
  );
};
