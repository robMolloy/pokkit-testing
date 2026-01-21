import { CustomIcon } from "@/components/custom/CustomIcon";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "./themeStore";

export function ThemeToggle() {
  const themeStore = useThemeStore();
  const theme = themeStore.data;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={themeStore.cycleTheme}
      title={(() => {
        return theme === "light" ? "Light mode" : theme === "dark" ? "Dark mode" : "System theme";
      })()}
    >
      <CustomIcon
        iconName={theme === "light" ? "Sun" : theme === "dark" ? "Moon" : "Monitor"}
        size="sm"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
