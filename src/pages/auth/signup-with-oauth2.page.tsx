import { CenteredItemTemplate } from "@/components/templates/CenteredItemTemplate";
import { Button } from "@/components/ui/button";
import { pb } from "@/config/pocketbaseConfig";
import { signupWithOAuth2Google } from "@/modules/auth/dbAuthUtils";
import {
  FormFeedbackMessages,
  useFormFeedbackMessages,
} from "@/modules/auth/formTemplates/FormFeedbackMessages";
import { Link } from "@/modules/auth/formTemplates/Link";
import { SimpleCard } from "@/modules/auth/formTemplates/SimpleCard";
import { LoggedOutUserOnlyRoute } from "@/modules/routeProtector/LoggedOutUserOnlyRoute";

export default function Page() {
  const formFeedback = useFormFeedbackMessages();

  return (
    <LoggedOutUserOnlyRoute>
      <CenteredItemTemplate>
        <SimpleCard
          title="Sign up with OAuth2"
          headerChildrenTop={
            <Link href="/auth" className="text-muted-foreground hover:underline">
              &lt; Back
            </Link>
          }
        >
          <div className="flex flex-col gap-4">
            {formFeedback.messages && formFeedback.status && (
              <FormFeedbackMessages messages={formFeedback.messages} status={formFeedback.status} />
            )}

            <Button
              className="w-full"
              onClick={async () => {
                const resp = await signupWithOAuth2Google({ pb });

                const fn = resp.success ? formFeedback.showSuccess : formFeedback.showError;
                fn(resp.messages);
              }}
            >
              Sign up with Google
            </Button>
          </div>
        </SimpleCard>
      </CenteredItemTemplate>
    </LoggedOutUserOnlyRoute>
  );
}
