import { useEffect } from "react";

export const GenericRouteProtectorTemplate = (p: {
  children: React.ReactNode;
  loadingCondition: () => boolean;
  condition: () => boolean;
  ConditionLoadingComponent?: React.ReactNode;
  ConditionSuccessComponent: React.ReactNode;
  ConditionFailureComponent?: React.ReactNode;
  onConditionLoading?: () => void;
  onConditionSuccess?: () => void;
  onConditionFailure?: () => void;
}) => {
  const isLoading = p.loadingCondition();
  const isSuccess = p.condition();

  useEffect(() => {
    if (isLoading) return p.onConditionLoading?.();
    if (isSuccess) return p.onConditionSuccess?.();
    return p.onConditionFailure?.();
  }, [isLoading, isSuccess]);

  if (isLoading) return p.ConditionLoadingComponent;
  if (isSuccess) return p.ConditionSuccessComponent;

  return p.ConditionFailureComponent;
};
