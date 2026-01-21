import { CustomIcon } from "@/components/custom/CustomIcon";
import { HeaderTemplate } from "@/components/templates/HeaderTemplate";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./themeToggle/ThemeToggle";

export const Header = () => {
  return (
    <HeaderTemplate
      Left={
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <CustomIcon iconName="Cloud" size="lg" />
          <span className="font-bold">pokkit Starter</span>
        </Link>
      }
      Right={<ThemeToggle />}
    />
  );
};
