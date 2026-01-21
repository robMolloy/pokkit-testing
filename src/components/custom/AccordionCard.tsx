import { Accordion, AccordionContent, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { AccordionItem } from "@radix-ui/react-accordion";

export const AccordionCard = (p: {
  value: string;
  topLeft?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  return (
    <Card className="p-0">
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full px-3">
          <AccordionItem value={p.value}>
            <AccordionTrigger className="flex justify-start gap-4 px-1">
              {p.topLeft}
              <div className="flex flex-1 flex-col gap-2">
                <CardTitle>{p.title}</CardTitle>
                {p.subtitle && <div className="no-underline">{p.subtitle}</div>}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-1">{p.children}</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};
