import { useCurrentUserStore } from "../authDataStore";
import { GenericRouteProtectorTemplate } from "./GenericRouteProtectorTemplate";

export const LoggedInUserOnlyRouteTemplate = (p: {
  children: React.ReactNode;
  LoadingComponent?: React.ReactNode;
  LoggedOutComponent?: React.ReactNode;
  onIsLoading?: () => void;
  onIsSuccess?: () => void;
  onIsFailure?: () => void;
}) => {
  const currentUserStore = useCurrentUserStore();

  const isLoading = currentUserStore.data.authStatus === "loading";
  const isLoggedIn = currentUserStore.data.authStatus === "loggedIn";

  return (
    <GenericRouteProtectorTemplate
      children={p.children}
      loadingCondition={() => isLoading}
      condition={() => isLoggedIn}
      ConditionLoadingComponent={p.LoadingComponent}
      ConditionSuccessComponent={p.children}
      ConditionFailureComponent={p.LoggedOutComponent}
      onConditionLoading={p.onIsLoading}
      onConditionSuccess={p.onIsSuccess}
      onConditionFailure={p.onIsFailure}
    />
  );
};
