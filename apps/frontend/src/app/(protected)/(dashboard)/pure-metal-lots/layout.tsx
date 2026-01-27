import React from 'react';

export default function PureMetalLotsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col flex-1 p-4 md:p-6">
      {children}
    </div>
  );
}
