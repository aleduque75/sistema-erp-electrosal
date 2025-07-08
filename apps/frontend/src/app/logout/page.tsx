"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function LogoutPage() {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    logout();
    router.push("/"); // Redireciona para a landing page
  }, [logout, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Saindo...</p>
    </div>
  );
}
