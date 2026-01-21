import { LoadingScreen } from "@/screens/LoadingScreen";
import { LoggedInUserOnlyRouteTemplate } from "../auth/routeProtectorTemplates/LoggedInUserOnlyRouteTemplate";
import { useNavigate } from "react-router-dom";

export const LoggedInUserOnlyRoute = (p: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  return (
    <LoggedInUserOnlyRouteTemplate
      children={p.children}
      LoadingComponent={<LoadingScreen />}
      onIsFailure={() => navigate("/auth")}
    />
  );
};
