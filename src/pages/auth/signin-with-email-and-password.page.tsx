import { CenteredItemTemplate } from "@/components/templates/CenteredItemTemplate";
import { pb } from "@/config/pocketbaseConfig";
import { SigninWithEmailAndPasswordForm } from "@/modules/auth/forms/SigninWithEmailAndPasswordForm";
import { Link } from "@/modules/auth/formTemplates/Link";
import { SimpleCard } from "@/modules/auth/formTemplates/SimpleCard";
import { LoggedOutUserOnlyRoute } from "@/modules/routeProtector/LoggedOutUserOnlyRoute";

export default function Page() {
  return (
    <LoggedOutUserOnlyRoute>
      <CenteredItemTemplate>
        <SimpleCard
          title="Sign in with Email and Password"
          headerChildrenTop={
            <Link href="/auth" className="text-muted-foreground hover:underline">
              &lt; Back
            </Link>
          }
        >
          <SigninWithEmailAndPasswordForm pb={pb} />
        </SimpleCard>
      </CenteredItemTemplate>
    </LoggedOutUserOnlyRoute>
  );
}
