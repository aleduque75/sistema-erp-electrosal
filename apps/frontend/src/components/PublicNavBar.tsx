"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Importe os componentes de formulário que você já criou
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Lado Esquerdo: Logo ou Nome do Sistema */}
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Sistema Beleza</span>
          </Link>
        </div>

        {/* Lado Direito: Botões de Ação com Modais */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          {/* ---- Botão e Modal de Login ---- */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost">Entrar</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Acessar sua Conta</DialogTitle>
              </DialogHeader>
              {/* O formulário de login é renderizado aqui dentro */}
              <LoginForm />
            </DialogContent>
          </Dialog>

          {/* ---- Botão e Modal de Registro ---- */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default">Registrar</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Crie sua Conta</DialogTitle>
              </DialogHeader>
              {/* O formulário de registro é renderizado aqui dentro */}
              <RegisterForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}