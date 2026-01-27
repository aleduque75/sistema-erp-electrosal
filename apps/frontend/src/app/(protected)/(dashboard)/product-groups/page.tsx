"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import api from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  commissionPercentage?: number;
  isReactionProductGroup: boolean;
}

export default function ProductGroupsPage() {
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [loading, setIsPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProductGroup, setCurrentProductGroup] = useState<ProductGroup | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    description: "",
    commissionPercentage: 0,
    isReactionProductGroup: false,
  });

  useEffect(() => {
    fetchProductGroups();
  }, []);

  const fetchProductGroups = async () => {
    setIsPageLoading(true);
    try {
      const response = await api.get<ProductGroup[]>("/product-groups");
      setProductGroups(response.data);
    } catch (error) {
      toast.error("Falha ao carregar grupos de produtos.");
      console.error("Erro ao carregar grupos de produtos:", error);
    } finally {
      setIsPageLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSave = async () => {
    try {
      if (currentProductGroup) {
        // Update
        await api.patch(`/product-groups/${currentProductGroup.id}`, formState);
        toast.success("Grupo de produto atualizado com sucesso!");
      } else {
        // Create
        await api.post("/product-groups", formState);
        toast.success("Grupo de produto criado com sucesso!");
      }
      fetchProductGroups();
      setIsModalOpen(false);
      setCurrentProductGroup(null);
      setFormState({ name: "", description: "", commissionPercentage: 0, isReactionProductGroup: false });
    } catch (error) {
      toast.error("Falha ao salvar grupo de produto.");
      console.error("Erro ao salvar grupo de produto:", error);
    }
  };

  const handleEdit = (productGroup: ProductGroup) => {
    setCurrentProductGroup(productGroup);
    setFormState({
      name: productGroup.name,
      description: productGroup.description || "",
      commissionPercentage: productGroup.commissionPercentage || 0,
      isReactionProductGroup: productGroup.isReactionProductGroup,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este grupo de produto?")) {
      try {
        await api.delete(`/product-groups/${id}`);
        toast.success("Grupo de produto excluído com sucesso!");
        fetchProductGroups();
      } catch (error) {
        toast.error("Falha ao excluir grupo de produto.");
        console.error("Erro ao excluir grupo de produto:", error);
      }
    }
  };

  const handleNew = () => {
    setCurrentProductGroup(null);
    setFormState({ name: "", description: "", commissionPercentage: 0, isReactionProductGroup: false });
    setIsModalOpen(true);
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Grupos de Produtos</h1>

      <Card>
        <CardHeader className="flex-row justify-between items-center">
          <CardTitle>Lista de Grupos</CardTitle>
          <Button onClick={handleNew}>Novo Grupo</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Comissão (%)</TableHead>
                  <TableHead>Produto de Reação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.description}</TableCell>
                    <TableCell>{group.commissionPercentage}%</TableCell>
                    <TableCell>{group.isReactionProductGroup ? "Sim" : "Não"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(group)} className="mr-2">Editar</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(group.id)}>Excluir</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentProductGroup ? "Editar Grupo de Produto" : "Novo Grupo de Produto"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input id="name" value={formState.name} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Descrição</Label>
              <Input id="description" value={formState.description} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="commissionPercentage" className="text-right">Comissão (%)</Label>
              <Input id="commissionPercentage" type="number" value={formState.commissionPercentage} onChange={handleInputChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="isReactionProductGroup" className="text-right">Produto de Reação</Label>
              <Checkbox
                id="isReactionProductGroup"
                checked={formState.isReactionProductGroup}
                onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isReactionProductGroup: checked as boolean }))}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
