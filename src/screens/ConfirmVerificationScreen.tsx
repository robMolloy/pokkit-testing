import { CustomIcon } from "@/components/custom/CustomIcon";
import { Button } from "@/components/ui/button";
import { pb } from "@/config/pocketbaseConfig";
import { confirmVerificationEmail, type TUser } from "@/modules/auth/dbAuthUtils";
import {
  FormFeedbackMessages,
  useFormFeedbackMessages,
} from "@/modules/auth/formTemplates/FormFeedbackMessages";
import { SimpleCard } from "@/modules/auth/formTemplates/SimpleCard";
import { useNavigate } from "react-router-dom";

export const ConfirmVerificationSuccessScreen = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center px-4 pt-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <CustomIcon iconName="Check" size="4xl" />
        </div>

        <div className="space-y-4 text-center">
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-semibold tracking-tight">Success!</h2>
            <p className="text-muted-foreground mt-2">
              You have successfully verified your email address.
            </p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ConfirmVerificationScreen = (p: { user: TUser | null; token: string }) => {
  const formFeedback = useFormFeedbackMessages();

  const navigate = useNavigate();

  return (
    <SimpleCard title="Confirm email verification">
      {formFeedback.status && formFeedback.messages && (
        <FormFeedbackMessages messages={formFeedback.messages} status={formFeedback.status} />
      )}
      {formFeedback.status !== "success" && (
        <Button
          className="w-full"
          onClick={async () => {
            const resp = await confirmVerificationEmail({ pb: pb, token: p.token });

            const showMessagesFn = resp.success ? formFeedback.showSuccess : formFeedback.showError;
            showMessagesFn(resp.messages);
          }}
        >
          Click to confirm email verification
        </Button>
      )}
      {formFeedback.status === "success" && (
        <Button className="w-full" onClick={async () => navigate("/")}>
          Go Home
        </Button>
      )}
    </SimpleCard>
  );
};
