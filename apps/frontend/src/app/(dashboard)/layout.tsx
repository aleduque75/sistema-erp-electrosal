import { Header } from '@/components/layout/header';
import { LandingPageData } from '@/config/landing-page';
import api from '@/lib/api';

async function getLandingPageData(): Promise<LandingPageData | null> {
  try {
    // Usando uma URL relativa para o fetch no lado do servidor
    const response = await api.get('/landing-page');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch landing page data for layout:', error);
    return null;
  }
}

export default async function DashboardLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const landingPageData = await getLandingPageData();

  return (
    <div className="relative flex min-h-screen flex-col">
      <Header 
        logoImage={landingPageData?.logoImage}
        logoText={landingPageData?.logoText}
      />
      <main className="flex-1">
        {children}
        {modal}
      </main>
    </div>
  );
}