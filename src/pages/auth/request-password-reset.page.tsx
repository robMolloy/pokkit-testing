import { CenteredItemTemplate } from "@/components/templates/CenteredItemTemplate";
import { pb } from "@/config/pocketbaseConfig";
import { RequestPasswordResetForm } from "@/modules/auth/forms/RequestPasswordResetForm";
import { Link } from "@/modules/auth/formTemplates/Link";
import { SimpleCard } from "@/modules/auth/formTemplates/SimpleCard";
import { LoggedOutUserOnlyRoute } from "@/modules/routeProtector/LoggedOutUserOnlyRoute";

export default function Page() {
  return (
    <LoggedOutUserOnlyRoute>
      <CenteredItemTemplate>
        <SimpleCard
          title="Forgot your password?"
          headerChildrenTop={
            <Link href="/auth" className="text-muted-foreground hover:underline">
              &lt; Back
            </Link>
          }
        >
          <RequestPasswordResetForm pb={pb} />
        </SimpleCard>
      </CenteredItemTemplate>
    </LoggedOutUserOnlyRoute>
  );
}
