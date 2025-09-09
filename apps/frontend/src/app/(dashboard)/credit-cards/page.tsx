"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Importe o formulário que criamos
import { CreditCardForm } from "./credit-card-form"; // Ajuste o caminho se o form estiver em outro lugar

// Interface para tipar os dados do cartão
interface CreditCard {
  id: string;
  name: string;
  flag: string;
  closingDay: number;
  dueDate: number;
  contaContabilPassivoId?: string | null;
}

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- LÓGICA DA MODAL ---
  // Estado para controlar qual cartão está sendo editado. Se for 'null', a modal está fechada.
  // Se for um objeto de cartão, a modal de edição abre.
  // Se for 'new', a modal de criação abre.
  const [modalState, setModalState] = useState<"new" | CreditCard | null>(null);

  // Função para buscar os cartões
  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/credit-cards");
      setCards(response.data);
    } catch (error) {
      toast.error("Falha ao carregar cartões de crédito.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  // Função chamada pelo formulário quando um cartão é salvo
  const handleSave = () => {
    setModalState(null); // Fecha a modal
    fetchCards(); // Atualiza a lista de cartões
  };

  return (
    <div className="mx-auto my-8 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Meus Cartões de Crédito</h1>
        <Button onClick={() => setModalState("new")}>
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Cartão
        </Button>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Bandeira</TableHead>
                <TableHead>Fechamento</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : (
                cards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell>{card.name}</TableCell>
                    <TableCell>{card.flag}</TableCell>
                    <TableCell>Dia {card.closingDay}</TableCell>
                    <TableCell>Dia {card.dueDate}</TableCell>
                    <TableCell className="text-right">
                      {/* Botão que abre a modal de edição */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setModalState(card)}
                      >
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- LÓGICA DA MODAL --- */}
      <Dialog
        open={modalState !== null}
        onOpenChange={(isOpen) => !isOpen && setModalState(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalState === "new"
                ? "Criar Novo Cartão"
                : "Editar Cartão de Crédito"}
            </DialogTitle>
          </DialogHeader>

          {/* Renderiza o formulário dentro da modal */}
          <CreditCardForm
            // Se modalState for um cartão, passa como initialData. Se for 'new', passa undefined.
            initialData={modalState !== "new" && modalState !== null ? modalState : undefined}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
