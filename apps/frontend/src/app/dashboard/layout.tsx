import { Header } from "@/components/layout/header";
import api from "@/lib/api";
import { LandingPageData } from "@/config/landing-page";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let landingPageData: LandingPageData | null = null;
  try {
    const response = await api.get("/landing-page");
    landingPageData = {
      ...response.data,
      logoImage: response.data.logoImage,
      logoText: response.data.logoText || undefined,
    };
  } catch (error) {
    console.error("Failed to fetch landing page data in DashboardLayout:", error);
    // Em caso de erro, pode-se usar um fallback ou deixar como null
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header
        logoText={landingPageData?.logoText}
        logoImage={landingPageData?.logoImage}
      />
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        {children}
      </main>
    </div>
  );
}
