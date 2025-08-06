"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { LoginForm } from "@/components/auth/LoginForm"; // Supondo que o LoginForm está em seu próprio arquivo

export function NavbarActions() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  return (
    <nav className="ml-auto flex gap-2 sm:gap-4 items-center">
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost">Entrar</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Acessar minha conta</DialogTitle>
            <DialogDescription>Bem-vindo(a) de volta!</DialogDescription>
          </DialogHeader>
          <LoginForm onLoginSuccess={() => setIsLoginModalOpen(false)} />
        </DialogContent>
      </Dialog>
      <Dialog open={isRegisterModalOpen} onOpenChange={setIsRegisterModalOpen}>
        <DialogTrigger asChild>
          <Button>Registrar</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar uma Conta</DialogTitle>
            <DialogDescription>
              Junte-se a nós para simplificar a gestão do seu negócio.
            </DialogDescription>
          </DialogHeader>
          <p className="text-center p-4">Formulário de Registro.</p>
        </DialogContent>
      </Dialog>
    </nav>
  );
}
