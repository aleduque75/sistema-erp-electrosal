import { DesktopMenu } from "./layout/DesktopMenu";
import { MobileMenu } from "./layout/MobileMenu";

export function Sidebar() {
  return (
    <div className="flex h-16 items-center justify-between px-4 md:px-6 bg-background border-b">
      <div className="flex items-center gap-4">
        <MobileMenu />
        <div className="hidden md:flex">
          <DesktopMenu />
        </div>
      </div>
    </div>
  );
}