import { useCurrentUserStore } from "../authDataStore";

import { GenericRouteProtectorTemplate } from "./GenericRouteProtectorTemplate";

export const VerifiedUserOnlyRouteTemplate = (p: {
  children: React.ReactNode;
  LoadingComponent?: React.ReactNode;
  NotVerifiedComponent?: React.ReactNode;
  onIsLoading?: () => void;
  onIsSuccess?: () => void;
  onIsFailure?: () => void;
}) => {
  const currentUserStore = useCurrentUserStore();

  const isLoading = currentUserStore.data.authStatus === "loading";
  const isVerified =
    currentUserStore.data.authStatus === "loggedIn" && currentUserStore.data.user.verified;

  return (
    <GenericRouteProtectorTemplate
      children={p.children}
      loadingCondition={() => isLoading}
      condition={() => isVerified}
      ConditionLoadingComponent={p.LoadingComponent}
      ConditionSuccessComponent={p.children}
      ConditionFailureComponent={p.NotVerifiedComponent}
      onConditionLoading={p.onIsLoading}
      onConditionSuccess={p.onIsSuccess}
      onConditionFailure={p.onIsFailure}
    />
  );
};
