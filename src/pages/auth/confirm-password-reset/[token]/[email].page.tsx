import { CenteredItemTemplate } from "@/components/templates/CenteredItemTemplate";
import { pb } from "@/config/pocketbaseConfig";
import { ConfirmPasswordResetForm } from "@/modules/auth/forms/ConfirmPasswordResetForm";
import { SimpleCard } from "@/modules/auth/formTemplates/SimpleCard";
import { LoggedOutUserOnlyRoute } from "@/modules/routeProtector/LoggedOutUserOnlyRoute";
import { Link, useParams } from "react-router-dom";

export default function Page() {
  const params = useParams();
  const token = params.token as string;
  const email = params.email as string;

  return (
    <LoggedOutUserOnlyRoute>
      <CenteredItemTemplate>
        <SimpleCard
          title="Confirm password reset"
          headerChildrenTop={
            <Link to="/auth" className="text-muted-foreground hover:underline">
              &lt; Back
            </Link>
          }
        >
          <ConfirmPasswordResetForm pb={pb} token={token} email={email} />
        </SimpleCard>
      </CenteredItemTemplate>
    </LoggedOutUserOnlyRoute>
  );
}
