import { Error404Screen } from "@/screens/Error404Screen";
import { LoadingScreen } from "@/screens/LoadingScreen";
import { AdminUserOnlyRouteTemplate } from "../auth/routeProtectorTemplates/AdminUserOnlyRouteTemplate";

export const AdminUserOnlyRoute = (p: { children: React.ReactNode }) => {
  return (
    <AdminUserOnlyRouteTemplate
      children={p.children}
      LoadingComponent={<LoadingScreen />}
      NotAdminComponent={<Error404Screen />}
    />
  );
};
