import { H1 } from "@/components/custom/H1";
import { MainLayout } from "@/components/templates/LayoutTemplate";
import { LoggedInUserOnlyRoute } from "@/modules/routeProtector/LoggedInUserOnlyRoute";

export default function Page() {
  return (
    <LoggedInUserOnlyRoute>
      <MainLayout>
        <H1>Welcome to pokkit Starter</H1>
        <br />
        <p className="text-muted-foreground">
          This is your dashboard. Start adding your content here.
        </p>
        {[...Array(100)].map((_, j) => (
          <div key={j}>this is how we scroooooolll</div>
        ))}
      </MainLayout>
    </LoggedInUserOnlyRoute>
  );
}
