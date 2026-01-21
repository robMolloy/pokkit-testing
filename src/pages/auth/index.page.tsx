import { CenteredItemTemplate } from "@/components/templates/CenteredItemTemplate";
import { pb } from "@/config/pocketbaseConfig";
import { listAuthMethods } from "@/modules/auth/dbAuthUtils";
import { AuthNavigationForm } from "@/modules/auth/forms/AuthNavigationForm";
import { LoggedOutUserOnlyRoute } from "@/modules/routeProtector/LoggedOutUserOnlyRoute";
import { ErrorScreen } from "@/screens/ErrorScreen";
import { LoadingScreen } from "@/screens/LoadingScreen";
import type { AuthMethodsList } from "pocketbase";
import { useEffect, useState } from "react";

export default function Page() {
  const [authMethodsList, setAuthMethodsList] = useState<AuthMethodsList | null | undefined>();

  useEffect(() => {
    (async () => {
      const resp = await listAuthMethods({ pb });
      setAuthMethodsList(resp.success ? resp.data : null);
    })();
  }, []);

  if (authMethodsList === null) return <ErrorScreen />;
  if (authMethodsList === undefined) return <LoadingScreen />;
  return (
    <LoggedOutUserOnlyRoute>
      <CenteredItemTemplate>
        <AuthNavigationForm authMethodsList={authMethodsList} />
      </CenteredItemTemplate>
    </LoggedOutUserOnlyRoute>
  );
}
