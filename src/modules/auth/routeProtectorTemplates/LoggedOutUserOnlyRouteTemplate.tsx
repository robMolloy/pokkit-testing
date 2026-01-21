import { useCurrentUserStore } from "../authDataStore";
import { GenericRouteProtectorTemplate } from "./GenericRouteProtectorTemplate";

export const LoggedOutUserOnlyRouteTemplate = (p: {
  children: React.ReactNode;
  LoadingComponent?: React.ReactNode;
  LoggedInComponent?: React.ReactNode;
  onIsLoading?: () => void;
  onIsSuccess?: () => void;
  onIsFailure?: () => void;
}) => {
  const currentUserStore = useCurrentUserStore();

  const isLoading = currentUserStore.data.authStatus === "loading";
  const isLoggedOut = currentUserStore.data.authStatus === "loggedOut";

  return (
    <GenericRouteProtectorTemplate
      children={p.children}
      loadingCondition={() => isLoading}
      condition={() => isLoggedOut}
      ConditionLoadingComponent={p.LoadingComponent}
      ConditionSuccessComponent={p.children}
      ConditionFailureComponent={p.LoggedInComponent}
      onConditionLoading={p.onIsLoading}
      onConditionSuccess={p.onIsSuccess}
      onConditionFailure={p.onIsFailure}
    />
  );
};
