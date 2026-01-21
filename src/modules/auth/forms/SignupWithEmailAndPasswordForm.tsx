import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { signinWithPassword, signUpWithPassword } from "../dbAuthUtils";
import type { PocketBase } from "../pocketbaseTypeHelpers";
import {
  FormFeedbackMessages,
  useFormFeedbackMessages,
} from "../formTemplates/FormFeedbackMessages";
import { TextInput } from "@/components/custom/CustomInputs";

export const SignupWithEmailAndPasswordForm = (p: {
  pb: PocketBase;
  onSignUpSuccess?: (message: string[]) => void;
  onSignUpError?: (message: string[]) => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
      const signUpResp = await signUpWithPassword({
        pb: p.pb,
        data: {
          name,
          email,
          status: "pending",
          role: "standard",
          emailVisibility: true,
          password,
          passwordConfirm,
        },
      });

      if (!signUpResp.success) return signUpResp;
      return signinWithPassword({ pb: p.pb, data: { email, password } });
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
          <Label htmlFor="name">Full Name</Label>
          <TextInput
            id="name"
            value={name}
            onInput={setName}
            name="name"
            type="text"
            placeholder="Enter your full name"
            required
          />
        </div>
        <div>
          <Label htmlFor="signup-email">Email</Label>
          <TextInput
            id="signup-email"
            value={email}
            onInput={setEmail}
            name="signup-email"
            type="email"
            placeholder="Enter your email"
            required
          />
        </div>
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
