"use client";

import { ReactNode } from 'react';
import { Header } from '../../../components/layout/header';
import { Sidebar } from '../../../components/layout/sidebar';
import { SidebarProvider, useSidebar } from '../../../context/sidebar-context';

export default function DashboardLayoutWrapper({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardLayoutContent children={children} modal={modal} />
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  const { sidebarWidth, isMobileOpen } = useSidebar();

  // Determine the left margin for the main content based on sidebar state
  // This margin will push the content to the right, preventing overlap
  const marginLeft = isMobileOpen ? 0 : sidebarWidth;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - always rendered, visibility controlled by CSS classes */}
      <Sidebar />
      <div
        className="flex flex-1 flex-col transition-all duration-300 ease-in-out"
        style={{ marginLeft: `${marginLeft}px` }} // Dynamic margin for content
      >
        <Header />
        <main className="flex flex-grow flex-col overflow-hidden p-4">
          <div className="mx-auto w-full max-w-7xl"> {/* Standardize content width */}
            {children}
            {modal}
          </div>
        </main>
      </div>
    </div>
  );
}
