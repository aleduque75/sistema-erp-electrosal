'use client';

import Link from 'next/link';
import translations from '../../public/locales/pt/common.json';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <section className="text-center mb-12 p-8 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-lg shadow-lg w-full max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">{translations.home.heroTitle}</h1>
        <p className="text-lg md:text-xl mb-12 opacity-90">
          {translations.home.heroSubtitle}
        </p>

        <Link href="/register" className="btn-secondary text-lg px-6 py-3 inline-block">
          {translations.home.getStarted}
        </Link>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="card p-6 text-center">
          <h2 className="text-xl font-bold text-primary-600 mb-3">{translations.home.stockManagementTitle}</h2>
          <p className="text-gray-700">
            {translations.home.stockManagementDescription}
          </p>
        </div>
        <div className="card p-6 text-center">
          <h2 className="text-xl font-bold text-primary-600 mb-3">{translations.home.financialManagementTitle}</h2>
          <p className="text-gray-700">
            {translations.home.financialManagementDescription}
          </p>
        </div>
        <div className="card p-6 text-center">
          <h2 className="text-xl font-bold text-primary-600 mb-3">{translations.home.customerFocusTitle}</h2>
          <p className="text-gray-700">
            {translations.home.customerFocusDescription}
          </p>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="text-center p-8 bg-primary-100 rounded-lg shadow-md w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-primary-800 mb-4">{translations.home.callToActionTitle}</h2>
        <p className="text-lg text-gray-700 mb-6">
          {translations.home.callToActionSubtitle}
        </p>
        <Link href="/register" className="btn-primary text-lg px-6 py-3 inline-block">
          {translations.home.signUpFree}
        </Link>
      </section>
    </div>
  );
}