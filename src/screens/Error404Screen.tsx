import { Button } from "@/components/ui/button";
import { Link } from "@/modules/auth/formTemplates/Link";

export const Error404Screen = () => {
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center overflow-y-auto">
      <div className="flex items-center">
        <div className="mr-6 border-r py-2 pr-6 text-2xl">404</div>
        <div>This page could not be found.</div>
      </div>
      <br />
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
};
