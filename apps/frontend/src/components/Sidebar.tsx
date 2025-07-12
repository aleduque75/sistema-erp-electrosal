import { MainMenu } from "./layout/main-menu";
import { MobileMenu } from "./layout/mobile-menu";

export function Sidebar() {
  return (
    <div className="flex h-16 items-center justify-between px-4 md:px-6 bg-background border-b">
      <div className="flex items-center gap-4">
        <MobileMenu />
        <div className="hidden md:flex">
          <MainMenu />
        </div>
      </div>
    </div>
  );
}