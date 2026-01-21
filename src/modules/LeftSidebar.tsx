import { LeftSidebarTemplate, SidebarButton } from "@/components/templates/LeftSidebarTemplate";
import { pb } from "@/config/pocketbaseConfig";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useCurrentUserStore } from "./auth/authDataStore";
import { logout } from "./auth/dbAuthUtils";

export const LeftSidebar = () => {
  const currentUserStore = useCurrentUserStore();
  const [scrollItemIndex, setScrollItemIndex] = useState(0);

  const location = useLocation();

  return (
    <div className="w-64">
      <LeftSidebarTemplate
        top={
          <>
            <SidebarButton href="/" iconName="Home" isHighlighted={location.pathname === "/"}>
              Home
            </SidebarButton>
            <SidebarButton
              href="/scroll"
              iconName="Ban"
              isHighlighted={location.pathname === "/scroll"}
            >
              Scroll
            </SidebarButton>
          </>
        }
        middle={[...Array(100)].map((_, j) => (
          <SidebarButton
            iconName="Ban"
            key={j}
            isHighlighted={j === scrollItemIndex}
            onClick={() => setScrollItemIndex(j)}
          >
            do summit {j} {j === scrollItemIndex && <>(selected)</>}
          </SidebarButton>
        ))}
        bottom={
          currentUserStore.data.authStatus === "loggedIn" && (
            <SidebarButton iconName="LogOut" isHighlighted={false} onClick={() => logout({ pb })}>
              Log Out
            </SidebarButton>
          )
        }
      />
    </div>
  );
};
