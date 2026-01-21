import { useCurrentUserStore } from "../authDataStore";
import { GenericRouteProtectorTemplate } from "./GenericRouteProtectorTemplate";

export const AdminUserOnlyRouteTemplate = (p: {
  children: React.ReactNode;
  LoadingComponent?: React.ReactNode;
  NotAdminComponent?: React.ReactNode;
  onIsLoading?: () => void;
  onIsSuccess?: () => void;
  onIsFailure?: () => void;
}) => {
  const currentUserStore = useCurrentUserStore();

  const isAdmin =
    currentUserStore.data.authStatus === "loggedIn" && currentUserStore.data.user.role === "admin";

  return (
    <GenericRouteProtectorTemplate
      children={p.children}
      loadingCondition={() => currentUserStore.data.authStatus === "loading"}
      condition={() => isAdmin}
      ConditionLoadingComponent={p.LoadingComponent}
      ConditionSuccessComponent={p.children}
      ConditionFailureComponent={p.NotAdminComponent}
      onConditionLoading={p.onIsLoading}
      onConditionSuccess={p.onIsSuccess}
      onConditionFailure={p.onIsFailure}
    />
  );
};
