import { AwaitingVerificationScreen } from "@/screens/AwaitingVerificationScreen";
import { LoadingScreen } from "@/screens/LoadingScreen";
import type { TUser } from "../auth/dbAuthUtils";
import type { PocketBase } from "../auth/pocketbaseTypeHelpers";
import { VerifiedUserOnlyRouteTemplate } from "../auth/routeProtectorTemplates/VerifiedUserOnlyRouteTemplate";

export const VerifiedUserOnlyRoute = (p: {
  children: React.ReactNode;
  pb: PocketBase;
  user: TUser;
}) => {
  return (
    <VerifiedUserOnlyRouteTemplate
      children={p.children}
      LoadingComponent={<LoadingScreen />}
      NotVerifiedComponent={<AwaitingVerificationScreen pb={p.pb} user={p.user} />}
    />
  );
};
