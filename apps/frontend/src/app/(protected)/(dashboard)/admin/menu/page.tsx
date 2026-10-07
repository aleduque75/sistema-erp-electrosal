'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings2, 
  Plus, 
  Trash2, 
  Edit2, 
  GripVertical, 
  ChevronRight, 
  ChevronDown,
  LayoutTemplate,
  Info,
  Move
} from 'lucide-react';
import { MenuItemForm } from './components/menu-item-form';
import { Badge } from '@/components/ui/badge';
import * as Icons from 'lucide-react';
import React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface MenuItem {
  id: string;
  title: string;
  href: string;
  icon: string | null;
  order: number;
  parentId: string | null;
  disabled: boolean;
  subItems?: MenuItem[];
}

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/menu');
      const menuData = res.data.menuItems || [];
      setItems(menuData);
      // Auto-expand all parents initially for easier reordering and visualization
      const allParentIds = new Set<string>(menuData.filter((i: MenuItem) => i.subItems && i.subItems.length > 0).map((i: MenuItem) => i.id));
      setExpandedItems(allParentIds);
    } catch (error) {
      toast.error('Erro ao carregar menu');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item? Sub-menus também serão removidos.')) return;

    try {
      await api.delete(`/menu/${id}`);
      toast.success('Item removido com sucesso');
      fetchMenu();
    } catch (error) {
      toast.error('Erro ao remover item');
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const renderIcon = (iconName: string | null) => {
    if (!iconName) return null;
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon size={16} className="text-muted-foreground" /> : null;
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    setIsSavingOrder(true);

    if (type === 'ROOT') {
      // Reordering root level menus
      const newItems = Array.from(items);
      const [moved] = newItems.splice(source.index, 1);
      newItems.splice(destination.index, 0, moved);

      // Reassign sequential orders
      const reorderedItems = newItems.map((item, idx) => ({
        ...item,
        order: idx,
      }));

      // Optimistic update
      setItems(reorderedItems);

      try {
        const payload = reorderedItems.map((item) => ({
          id: item.id,
          order: item.order,
        }));
        await api.patch('/menu/reorder', { items: payload });
        toast.success('Ordem dos menus atualizada com sucesso!');
      } catch (err) {
        toast.error('Erro ao salvar nova ordem dos menus');
        fetchMenu();
      } finally {
        setIsSavingOrder(false);
      }
    } else if (type === 'SUBITEM') {
      // Subitem reordering within parent or between parents
      const sourceParentId = source.droppableId.replace('subitems-', '');
      const destParentId = destination.droppableId.replace('subitems-', '');

      const newItems = items.map((parent) => {
        if (parent.id === sourceParentId && sourceParentId === destParentId) {
          // Reorder within same parent
          const newSubItems = Array.from(parent.subItems || []);
          const [moved] = newSubItems.splice(source.index, 1);
          newSubItems.splice(destination.index, 0, moved);

          const reorderedSubItems = newSubItems.map((sub, idx) => ({
            ...sub,
            order: idx,
          }));

          return { ...parent, subItems: reorderedSubItems };
        } else if (parent.id === sourceParentId) {
          // Moved out of this parent
          const newSubItems = Array.from(parent.subItems || []);
          newSubItems.splice(source.index, 1);
          return {
            ...parent,
            subItems: newSubItems.map((s, idx) => ({ ...s, order: idx })),
          };
        } else if (parent.id === destParentId) {
          // Moved into this parent
          const sourceParent = items.find((p) => p.id === sourceParentId);
          const movedItem = sourceParent?.subItems?.[source.index];
          if (!movedItem) return parent;

          const newSubItems = Array.from(parent.subItems || []);
          newSubItems.splice(destination.index, 0, {
            ...movedItem,
            parentId: destParentId,
          });

          return {
            ...parent,
            subItems: newSubItems.map((s, idx) => ({ ...s, order: idx })),
          };
        }
        return parent;
      });

      setItems(newItems);

      try {
        const payload: { id: string; order: number; parentId?: string | null }[] = [];
        if (sourceParentId === destParentId) {
          const parent = newItems.find((p) => p.id === sourceParentId);
          parent?.subItems?.forEach((sub, idx) => {
            payload.push({ id: sub.id, order: idx, parentId: sourceParentId });
          });
        } else {
          const sourceParent = newItems.find((p) => p.id === sourceParentId);
          sourceParent?.subItems?.forEach((sub, idx) => {
            payload.push({ id: sub.id, order: idx, parentId: sourceParentId });
          });
          const destParent = newItems.find((p) => p.id === destParentId);
          destParent?.subItems?.forEach((sub, idx) => {
            payload.push({ id: sub.id, order: idx, parentId: destParentId });
          });
        }

        await api.patch('/menu/reorder', { items: payload });
        toast.success('Ordem dos submenus atualizada com sucesso!');
      } catch (err) {
        toast.error('Erro ao salvar nova ordem dos submenus');
        fetchMenu();
      } finally {
        setIsSavingOrder(false);
      }
    }
  };

  const rootItems = items.filter(item => !item.parentId);

  return (
    <div className="space-y-6 p-3 sm:p-6 md:p-8 animate-in fade-in duration-500 bg-background min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Settings2 className="text-primary h-7 w-7" />
            Configuração do Menu
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Arraste os itens para definir a ordem e hierarquia do menu lateral do sistema.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => {
              setEditingItem(null);
              setFormOpen(true);
            }}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-semibold text-xs sm:text-sm h-9 sm:h-10 rounded-xl"
          >
            <Plus size={16} className="mr-1.5" />
            Novo Item
          </Button>
        </div>
      </div>

      {/* Reorder Help Tip Alert */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-foreground text-xs">
        <Move className="h-4 w-4 text-primary shrink-0" />
        <span>
          <strong>Dica de Organização:</strong> Clique e segure no ícone <GripVertical className="inline h-3.5 w-3.5 text-muted-foreground" /> à esquerda de qualquer item para arrastá-lo para cima ou para baixo. A nova ordem é salva automaticamente!
        </span>
      </div>

      <Card className="border-border/80 shadow-lg bg-card rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/80 px-4 sm:px-6 py-3.5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <LayoutTemplate size={16} />
              Estrutura de Navegação
            </CardTitle>
            {isSavingOrder && (
              <Badge variant="outline" className="text-primary border-primary/30 animate-pulse text-[11px]">
                Salvando alterações...
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground italic text-sm">Carregando estrutura...</div>
          ) : items.length === 0 ? (
            <div className="p-16 text-center space-y-4">
              <p className="text-muted-foreground italic text-sm">Nenhum item de menu configurado.</p>
              <Button variant="outline" className="border-border rounded-xl" onClick={() => setFormOpen(true)}>
                Criar meu primeiro item
              </Button>
            </div>
          ) : !isMounted ? (
            <div className="p-8 text-center text-muted-foreground text-xs">Inicializando organizador...</div>
          ) : (
            <div className="overflow-x-auto">
              <DragDropContext onDragEnd={handleDragEnd}>
                <Table className="border-none">
                  <TableHeader className="bg-muted/40">
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="w-12 text-center font-bold text-foreground">Mover</TableHead>
                      <TableHead className="font-bold text-foreground min-w-[200px]">Item</TableHead>
                      <TableHead className="font-bold text-foreground min-w-[140px]">Link</TableHead>
                      <TableHead className="text-center font-bold text-foreground w-20">Ordem</TableHead>
                      <TableHead className="text-right font-bold text-foreground w-28 px-4">Ações</TableHead>
                    </TableRow>
                  </TableHeader>

                  <Droppable droppableId="root-menu-items" type="ROOT">
                    {(provided) => (
                      <TableBody
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="divide-y divide-border/60"
                      >
                        {items.map((item, index) => {
                          const hasSubItems = item.subItems && item.subItems.length > 0;
                          const isExpanded = expandedItems.has(item.id);

                          return (
                            <React.Fragment key={item.id}>
                              {/* Root Item Row */}
                              <Draggable draggableId={item.id} index={index}>
                                {(dragProvided, snapshot) => (
                                  <TableRow
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    className={`border-border transition-colors ${
                                      snapshot.isDragging
                                        ? 'bg-primary/15 shadow-xl ring-2 ring-primary/40 z-50'
                                        : item.disabled
                                        ? 'opacity-50 hover:bg-muted/30'
                                        : 'hover:bg-muted/40'
                                    }`}
                                  >
                                    {/* Drag Handle */}
                                    <TableCell className="w-12 text-center p-2">
                                      <div
                                        {...dragProvided.dragHandleProps}
                                        className="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-muted cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
                                        title="Arraste para reposicionar menu"
                                      >
                                        <GripVertical size={16} />
                                      </div>
                                    </TableCell>

                                    {/* Item Title + Icon + Expander */}
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        {hasSubItems ? (
                                          <button
                                            type="button"
                                            onClick={() => toggleExpand(item.id)}
                                            className="p-1 hover:bg-muted rounded-md text-foreground transition-colors"
                                            title={isExpanded ? "Recolher subitens" : "Expandir subitens"}
                                          >
                                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                          </button>
                                        ) : (
                                          <div className="w-6" />
                                        )}
                                        {renderIcon(item.icon)}
                                        <span className="font-semibold text-sm text-foreground">{item.title}</span>
                                        {item.disabled && (
                                          <Badge variant="outline" className="text-[10px] h-4 border-muted">
                                            Inativo
                                          </Badge>
                                        )}
                                        {hasSubItems && (
                                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 rounded-full font-mono">
                                            {item.subItems?.length}
                                          </Badge>
                                        )}
                                      </div>
                                    </TableCell>

                                    {/* Link */}
                                    <TableCell>
                                      <code className="text-xs bg-muted/60 px-2 py-0.5 rounded-md text-muted-foreground font-mono">
                                        {item.href}
                                      </code>
                                    </TableCell>

                                    {/* Order Number */}
                                    <TableCell className="text-center font-mono text-xs font-bold text-foreground">
                                      {item.order}
                                    </TableCell>

                                    {/* Actions */}
                                    <TableCell className="text-right space-x-1 px-4">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-primary hover:bg-primary/10 rounded-lg"
                                        onClick={() => {
                                          setEditingItem(item);
                                          setFormOpen(true);
                                        }}
                                        title="Editar menu"
                                      >
                                        <Edit2 size={14} />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                                        onClick={() => handleDelete(item.id)}
                                        title="Excluir menu"
                                      >
                                        <Trash2 size={14} />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </Draggable>

                              {/* Nested Subitems (when parent is expanded) */}
                              {hasSubItems && isExpanded && (
                                <Droppable droppableId={`subitems-${item.id}`} type="SUBITEM">
                                  {(subDroppableProvided) => (
                                    <tr className="bg-muted/10">
                                      <td colSpan={5} className="p-0 border-b border-border/40">
                                        <div
                                          ref={subDroppableProvided.innerRef}
                                          {...subDroppableProvided.droppableProps}
                                          className="divide-y divide-border/40 pl-6 sm:pl-10"
                                        >
                                          {item.subItems!.map((subItem, subIndex) => (
                                            <Draggable key={subItem.id} draggableId={subItem.id} index={subIndex}>
                                              {(subDragProvided, subSnapshot) => (
                                                <div
                                                  ref={subDragProvided.innerRef}
                                                  {...subDragProvided.draggableProps}
                                                  className={`flex items-center justify-between py-2.5 px-3 transition-colors ${
                                                    subSnapshot.isDragging
                                                      ? 'bg-primary/20 shadow-lg rounded-xl ring-2 ring-primary/40 z-50'
                                                      : 'hover:bg-muted/40'
                                                  }`}
                                                >
                                                  {/* Subitem Drag Handle & Title */}
                                                  <div className="flex items-center gap-2.5 min-w-0">
                                                    <div
                                                      {...subDragProvided.dragHandleProps}
                                                      className="p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0"
                                                      title="Arraste para reposicionar subitem"
                                                    >
                                                      <GripVertical size={14} />
                                                    </div>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                      {renderIcon(subItem.icon)}
                                                      <span className="text-xs sm:text-sm font-medium text-foreground truncate">
                                                        {subItem.title}
                                                      </span>
                                                      {subItem.disabled && (
                                                        <Badge variant="outline" className="text-[9px] h-3.5 border-muted">
                                                          Inativo
                                                        </Badge>
                                                      )}
                                                    </div>
                                                  </div>

                                                  {/* Subitem Link, Order & Actions */}
                                                  <div className="flex items-center gap-4 shrink-0 pr-1">
                                                    <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono hidden md:inline-block">
                                                      {subItem.href}
                                                    </code>
                                                    <span className="text-xs font-mono font-bold text-muted-foreground w-8 text-center">
                                                      #{subItem.order}
                                                    </span>
                                                    <div className="flex items-center space-x-1">
                                                      <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg"
                                                        onClick={() => {
                                                          setEditingItem(subItem);
                                                          setFormOpen(true);
                                                        }}
                                                        title="Editar subitem"
                                                      >
                                                        <Edit2 size={13} />
                                                      </Button>
                                                      <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                                                        onClick={() => handleDelete(subItem.id)}
                                                        title="Excluir subitem"
                                                      >
                                                        <Trash2 size={13} />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </Draggable>
                                          ))}
                                          {subDroppableProvided.placeholder}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Droppable>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {provided.placeholder}
                      </TableBody>
                    )}
                  </Droppable>
                </Table>
              </DragDropContext>
            </div>
          )}
        </CardContent>
      </Card>

      <MenuItemForm 
        open={formOpen} 
        onOpenChange={setFormOpen}
        onSuccess={fetchMenu}
        initialData={editingItem}
        parentItems={rootItems}
      />
    </div>
  );
}
