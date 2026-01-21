import { CustomIcon } from "@/components/custom/CustomIcon";
import { Button } from "@/components/ui/button";

import { requestVerificationEmail, type TUser } from "@/modules/auth/dbAuthUtils";
import {
  FormFeedbackMessages,
  useFormFeedbackMessages,
} from "@/modules/auth/formTemplates/FormFeedbackMessages";
import type { PocketBase } from "@/modules/auth/pocketbaseTypeHelpers";

export const AwaitingVerificationScreen = (p: { pb: PocketBase; user: TUser }) => {
  const formFeedback = useFormFeedbackMessages();
  return (
    <div className="flex flex-col items-center justify-center px-4 pt-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <CustomIcon iconName="Check" size="4xl" />
        </div>

        <div className="space-y-4 text-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Awaiting Verification</h2>
            <p className="text-muted-foreground mt-2">
              The email address registered to your account is required to be verified before you can
              access the platform.
            </p>
          </div>

          <div className="bg-card text-muted-foreground flex flex-col gap-4 rounded-lg border p-4 text-sm">
            <p className="text-foreground font-medium">
              You should receive an email when you first sign up. Check your spam folder if you
              don't see it or you can request a new one.
            </p>
            {formFeedback.messages && formFeedback.status && (
              <FormFeedbackMessages messages={formFeedback.messages} status={formFeedback.status} />
            )}
            <div>
              <Button
                onClick={async () => {
                  const resp = await requestVerificationEmail({ pb: p.pb, email: p.user.email });
                  const showMessagesFn = resp.success
                    ? formFeedback.showSuccess
                    : formFeedback.showError;
                  showMessagesFn(resp.messages);
                }}
              >
                Request Verification Email
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
