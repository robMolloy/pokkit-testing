import { Button } from "@/components/ui/button";
import { Tooltip } from "@radix-ui/react-tooltip";

import { TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { PreserveScrollAbility } from "./LayoutTemplate";
import { Link } from "react-router-dom";
import { CustomIcon } from "../custom/CustomIcon";

const SidebarButtonWrapper = (p: {
  children: React.ReactNode;
  href?: string;
  disabled?: boolean;
}) => {
  return p.href ? (
    <Link
      to={p.disabled ? "#" : p.href}
      className={p.disabled ? "pointer-events-none" : ""}
    >
      {p.children}
    </Link>
  ) : (
    p.children
  );
};

const PossibleTooltipWrapper = (p: {
  children: React.ReactNode;
  tooltipContent?: React.ReactNode;
}) => {
  return p.tooltipContent ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{p.children}</TooltipTrigger>
        <TooltipContent>{p.tooltipContent}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    <>{p.children}</>
  );
};

export const SidebarButton = (p: {
  href?: string;
  iconName?: React.ComponentProps<typeof CustomIcon>["iconName"];
  children: React.ReactNode;
  isHighlighted: boolean;
  onClick?: () => void;
  badgeCount?: number;
  disabled?: boolean;
  tooltipContent?: React.ReactNode;
}) => {
  return (
    <SidebarButtonWrapper href={p.href} disabled={p.disabled}>
      <PossibleTooltipWrapper tooltipContent={p.tooltipContent}>
        <Button
          variant={p.isHighlighted ? "secondary" : "ghost"}
          className={`w-full justify-between ${
            p.disabled ? "pointer-events-none" : ""
          }`}
          onClick={p.onClick}
          disabled={p.disabled}
        >
          <span className="flex w-full items-center gap-2 text-left">
            {p.iconName && (
              <CustomIcon
                iconName={p.iconName}
                size="sm"
                className={p.disabled ? "text-muted-foreground" : ""}
              />
            )}

            {p.children}
          </span>

          {p.badgeCount !== undefined && p.badgeCount > 0 && (
            <span className="rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
              {p.badgeCount}
            </span>
          )}
        </Button>
      </PossibleTooltipWrapper>
    </SidebarButtonWrapper>
  );
};

export const LeftSidebarTemplate = (p: {
  top?: React.ReactNode;
  middle?: React.ReactNode;
  bottom?: React.ReactNode;
}) => {
  return (
    <PreserveScrollAbility className="border-r">
      {p.top && <div className="flex flex-col gap-1 border-b p-2">{p.top}</div>}
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {p.middle}
      </div>
      {p.bottom && (
        <div className="flex flex-col gap-1 border-t p-2">{p.bottom}</div>
      )}
    </PreserveScrollAbility>
  );
};
