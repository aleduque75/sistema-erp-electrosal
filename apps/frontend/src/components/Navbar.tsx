'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import translations from '../../public/locales/pt/common.json';
import { useState } from 'react';
import { ThemeToggle } from './ui/theme-toggle';

export default function Navbar() {
  const { user, logout, loading } = useAuth();

  return (
    <nav className="bg-primary-700 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/dashboard" className="text-primary-foreground text-xl font-bold tracking-wide">
          {translations.navbar.dashboard}
        </Link>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Cadastros Dropdown */}
              <div
                className="relative group min-w-fit"
              >
                <button className="text-primary-foreground bg-transparent hover:bg-primary-500 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition duration-150 ease-in-out">
                  {translations.navbar.registrations}
                </button>
                <div className="absolute left-0 top-full hidden group-hover:block w-48 bg-card rounded-md shadow-xl py-1 z-10">
                    <Link href="/clients" className="block px-4 py-2 text-sm text-card-foreground hover:bg-accent hover:text-accent-foreground">
                      {translations.navbar.clients}
                    </Link>
                    <Link href="/products" className="block px-4 py-2 text-sm text-card-foreground hover:bg-accent hover:text-accent-foreground">
                      {translations.navbar.products}
                    </Link>
                  </div>
              </div>

              {/* Financeiro Dropdown */}
              <div
                className="relative group min-w-fit"
              >
                <button className="text-primary-foreground bg-transparent hover:bg-primary-500 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition duration-150 ease-in-out">
                  {translations.navbar.financial}
                </button>
                <div className="absolute left-0 top-full hidden group-hover:block w-48 bg-card rounded-md shadow-xl py-1 z-10">
                    <Link href="/sales" className="block px-4 py-2 text-sm text-card-foreground hover:bg-accent hover:text-accent-foreground">
                      {translations.navbar.sales}
                    </Link>
                    <Link href="/accounts-pay" className="block px-4 py-2 text-sm text-card-foreground hover:bg-accent hover:text-accent-foreground">
                      {translations.navbar.accountsPayable}
                    </Link>
                    <Link href="/accounts-rec" className="block px-4 py-2 text-sm text-card-foreground hover:bg-accent hover:text-accent-foreground">
                      {translations.navbar.accountsReceivable}
                    </Link>
                    <Link href="/contas-contabeis" className="block px-4 py-2 text-sm text-card-foreground hover:bg-accent hover:text-accent-foreground">
                      {translations.navbar.accountingAccounts}
                    </Link>
                    <Link href="/contas-correntes" className="block px-4 py-2 text-sm text-card-foreground hover:bg-accent hover:text-accent-foreground">
                      {translations.navbar.currentAccounts}
                    </Link>
                  </div>
              </div>

              <span className="text-primary-100 text-sm font-medium">Bem-vindo, {user.email}</span>
              <button
                onClick={logout}
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
              >
                {translations.navbar.logout}
              </button>
              <ThemeToggle />
            </>
          ) : (
            <>
              <Link href="/login" className="text-primary-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">
                {translations.navbar.login}
              </Link>
              <Link href="/register" className="text-primary-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out">
                {translations.navbar.register}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
