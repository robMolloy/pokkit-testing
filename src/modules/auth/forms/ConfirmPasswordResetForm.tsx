import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { useState } from "react";
import { confirmPasswordReset, signinWithPassword } from "../dbAuthUtils";
import type { PocketBase } from "../pocketbaseTypeHelpers";
import {
  FormFeedbackMessages,
  useFormFeedbackMessages,
} from "../formTemplates/FormFeedbackMessages";
import { TextInput } from "@/components/custom/CustomInputs";

export const ConfirmPasswordResetForm = (p: {
  pb: PocketBase;
  token: string;
  email: string;
  onSignUpSuccess?: (message: string[]) => void;
  onSignUpError?: (message: string[]) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const formFeedback = useFormFeedbackMessages();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    if (password !== passwordConfirm) {
      const errorMessages = ["Passwords do not match"];
      p.onSignUpError?.(errorMessages);
      formFeedback.showError(errorMessages);
      setIsLoading(false);
      return;
    }

    const resp = await (async () => {
      const signUpResp = await confirmPasswordReset({
        pb: p.pb,
        data: { token: p.token, password, passwordConfirm },
      });

      if (!signUpResp.success) return signUpResp;
      return signinWithPassword({ pb: p.pb, data: { email: p.email, password } });
    })();

    const successFn = resp.success ? p.onSignUpSuccess : p.onSignUpError;
    successFn?.(resp.messages);

    const showMessageFn = resp.success ? formFeedback.showSuccess : formFeedback.showError;
    showMessageFn(resp.messages);

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {formFeedback.messages && formFeedback.status && (
        <FormFeedbackMessages messages={formFeedback.messages} status={formFeedback.status} />
      )}
      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="signup-password">Password</Label>
          <TextInput
            id="signup-password"
            value={password}
            onInput={setPassword}
            name="signup-password"
            type="password"
            placeholder="Create a password"
            required
          />
        </div>
        <div>
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <TextInput
            id="confirm-password"
            value={passwordConfirm}
            onInput={setPasswordConfirm}
            name="confirm-password"
            type="password"
            placeholder="Confirm your password"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>
    </div>
  );
};
