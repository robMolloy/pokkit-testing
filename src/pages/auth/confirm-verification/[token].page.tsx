import { CenteredItemTemplate } from "@/components/templates/CenteredItemTemplate";
import { useCurrentUserStore } from "@/modules/auth/authDataStore";
import { ConfirmVerificationScreen } from "@/screens/ConfirmVerificationScreen";
import { LoadingScreen } from "@/screens/LoadingScreen";
import { useParams } from "react-router-dom";

export default function Page() {
  const params = useParams();
  const currentUserStore = useCurrentUserStore();

  const token = params.token as string;

  if (token === undefined) return <LoadingScreen />;
  if (currentUserStore.data.authStatus === "loading") return <LoadingScreen />;

  return (
    <CenteredItemTemplate>
      <ConfirmVerificationScreen
        token={token}
        user={currentUserStore.data.authStatus === "loggedIn" ? currentUserStore.data.user : null}
      />
    </CenteredItemTemplate>
  );
}
