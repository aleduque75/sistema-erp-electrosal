'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
import { MainMenu } from './main-menu'

export function ProtectedContent({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading || !isAuthenticated) {
    // Mostra uma tela de carregamento para evitar renderizar o conteúdo
    // antes da verificação de autenticação estar completa.
    return (
      <div className="flex h-screen w-full items-center justify-center">
        Carregando...
      </div>
    )
  }

  // Se autenticado, renderiza o layout com o menu e o conteúdo da página.
  return (
    <div className="flex min-h-screen">
      <MainMenu />
      <main className="flex-1 p-4">{children}</main>
    </div>
  )
}
