import { LoadingScreen } from "@/screens/LoadingScreen";
import { useNavigate } from "react-router-dom";
import { LoggedOutUserOnlyRouteTemplate } from "../auth/routeProtectorTemplates/LoggedOutUserOnlyRouteTemplate";

export const LoggedOutUserOnlyRoute = (p: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  return (
    <LoggedOutUserOnlyRouteTemplate
      children={p.children}
      LoadingComponent={<LoadingScreen />}
      onIsFailure={() => navigate("/")}
    />
  );
};
