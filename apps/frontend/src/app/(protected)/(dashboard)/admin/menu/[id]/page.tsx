"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api from "@/lib/api";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";

interface MenuItem {
  id: string;
  title: string;
  href: string;
  icon?: string;
  order: number;
  disabled?: boolean;
  parentId?: string | null;
  subItems?: MenuItem[];
}

export default function MenuItemEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState("");
  const [href, setHref] = useState("");
  const [icon, setIcon] = useState("");
  const [order, setOrder] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  const [availableParents, setAvailableParents] = useState<MenuItem[]>([]);
  const [subItems, setSubItems] = useState<MenuItem[]>([]);
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    fetchParents();
    if (id === "new") {
      setIsNew(true);
    } else {
      setIsNew(false);
      fetchMenuItem(id);
    }
  }, [id]);

  const fetchParents = async () => {
    try {
      const response = await api.get('/menu');
      if (response.status === 200) {
        const data = response.data;
        const menuItems: MenuItem[] = data.menuItems || [];
        setAvailableParents(menuItems.filter(item => item.id !== id));
      } else {
        console.error("Failed to fetch parent menu items");
      }
    } catch (error) {
      console.error("Error fetching parent menu items:", error);
    }
  };

  const fetchMenuItem = async (menuItemId: string) => {
    try {
      const response = await api.get(`/menu/${menuItemId}`);
      if (response.status === 200) {
        const data: MenuItem = response.data;
        setTitle(data.title);
        setHref(data.href);
        setIcon(data.icon || "");
        setOrder(data.order);
        setDisabled(data.disabled || false);
        setParentId(data.parentId || null);
        setSubItems(data.subItems?.sort((a, b) => a.order - b.order) || []);
      } else {
        console.error("Failed to fetch menu item");
      }
    } catch (error) {
      console.error("Error fetching menu item:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const menuItemData = {
      title,
      href,
      icon: icon || undefined,
      order,
      disabled,
      parentId: parentId || undefined,
    };

    try {
      const response = isNew
        ? await api.post('/menu', menuItemData)
        : await api.patch(`/menu/${id}`, menuItemData);

      if (response.status === 201 || response.status === 200) {
        toast.success(`Item de menu ${isNew ? 'criado' : 'atualizado'} com sucesso!`);
        router.push("/admin/menu");
      } else {
        toast.error("Falha ao salvar o item de menu.");
      }
    } catch (error) {
      toast.error("Erro ao salvar o item de menu.");
    }
  };

  const onSubItemsDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const reorderedSubItems = Array.from(subItems);
    const [movedItem] = reorderedSubItems.splice(result.source.index, 1);
    reorderedSubItems.splice(result.destination.index, 0, movedItem);
    
    setSubItems(reorderedSubItems);

    const itemsToUpdate = reorderedSubItems.map((item, index) => ({
      id: item.id,
      order: index,
    }));

    try {
      await api.patch('/menu/reorder', { items: itemsToUpdate });
      toast.success("Ordem dos sub-itens atualizada!");
    } catch (error) {
      toast.error("Falha ao atualizar a ordem.");
      fetchMenuItem(id);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{isNew ? "Adicionar Novo Item de Menu" : "Editar Item de Menu"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="href">URL (Href)</Label>
              <Input id="href" value={href} onChange={(e) => setHref(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="icon">Ícone (Nome do componente Lucide)</Label>
              <Input id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Ex: LayoutDashboard, Users" />
            </div>
            <div>
              <Label htmlFor="order">Ordem</Label>
              <Input id="order" type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value))} required />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="disabled" checked={disabled} onCheckedChange={setDisabled} />
              <Label htmlFor="disabled">Desabilitado</Label>
            </div>
            <div>
              <Label htmlFor="parentId">Item Pai (Sub-menu de)</Label>
              <Select value={parentId || ""} onValueChange={(value) => setParentId(value === "null" ? null : value)}>
                <SelectTrigger id="parentId"><SelectValue placeholder="Selecionar item pai" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Nenhum (Item de nível superior)</SelectItem>
                  {availableParents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>{parent.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/menu")}>Cancelar</Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {!isNew && (
        <Card>
          <CardHeader>
            <CardTitle>Sub-itens</CardTitle>
          </CardHeader>
          <CardContent>
            <DragDropContext onDragEnd={onSubItemsDragEnd}>
              <Droppable droppableId="subitems-droppable">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="w-10"></th>
                          <th className="text-left p-2">Título</th>
                          <th className="text-left p-2">Ordem</th>
                          <th className="text-right p-2">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subItems.map((subItem, index) => (
                          <Draggable key={subItem.id} draggableId={subItem.id} index={index}>
                            {(provided, snapshot) => (
                              <tr
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`border-b ${snapshot.isDragging ? "bg-accent" : ""}`}
                              >
                                <td className="p-2 text-center cursor-grab">
                                  <span {...provided.dragHandleProps}>
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                  </span>
                                </td>
                                <td className="p-2">{subItem.title}</td>
                                <td className="p-2">{subItem.order}</td>
                                <td className="p-2 text-right">
                                  <Button variant="outline" size="sm" onClick={() => router.push(`/admin/menu/${subItem.id}`)}>
                                    Editar
                                  </Button>
                                </td>
                              </tr>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </tbody>
                    </table>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
