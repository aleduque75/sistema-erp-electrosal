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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings2, 
  Plus, 
  Trash2, 
  Edit2, 
  GripVertical, 
  ChevronRight, 
  ChevronDown,
  LayoutTemplate
} from 'lucide-react';
import { MenuItemForm } from './components/menu-item-form';
import { Badge } from '@/components/ui/badge';
import * as Icons from 'lucide-react';
import React from 'react';

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

  const fetchMenu = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/menu');
      setItems(res.data.menuItems || []);
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

  const renderRows = (menuItems: MenuItem[], level = 0) => {
    return menuItems.map((item) => (
      <React.Fragment key={item.id}>
        <TableRow className={`border-border ${item.disabled ? 'opacity-50' : ''}`}>
          <TableCell className="w-10">
            <GripVertical size={16} className="text-muted/50 cursor-grab" />
          </TableCell>
          <TableCell>
            <div 
              className="flex items-center gap-2" 
              style={{ paddingLeft: `${level * 24}px` }}
            >
              {item.subItems && item.subItems.length > 0 ? (
                <button 
                  onClick={() => toggleExpand(item.id)} 
                  className="p-1 hover:bg-muted rounded text-foreground"
                >
                  {expandedItems.has(item.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
              ) : (
                <div className="w-6" />
              )}
              {renderIcon(item.icon)}
              <span className="font-medium text-foreground">{item.title}</span>
              {item.disabled && <Badge variant="outline" className="text-[10px] h-4 border-muted">Inativo</Badge>}
            </div>
          </TableCell>
          <TableCell>
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
              {item.href}
            </code>
          </TableCell>
          <TableCell className="text-center text-foreground">{item.order}</TableCell>
          <TableCell className="text-right space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-primary hover:bg-primary/10"
              onClick={() => {
                setEditingItem(item);
                setFormOpen(true);
              }}
            >
              <Edit2 size={14} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => handleDelete(item.id)}
            >
              <Trash2 size={14} />
            </Button>
          </TableCell>
        </TableRow>
        {item.subItems && item.subItems.length > 0 && expandedItems.has(item.id) && 
          renderRows(item.subItems, level + 1)
        }
      </React.Fragment>
    ));
  };

  const rootItems = items.filter(item => !item.parentId);

  return (
    <div className="space-y-8 md:p-8 animate-in fade-in duration-700 bg-background min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings2 className="text-primary" />
            Configuração do Menu
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie a estrutura, ícones e hierarquia do menu lateral.</p>
        </div>
        <Button 
          onClick={() => {
            setEditingItem(null);
            setFormOpen(true);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-lg shadow-primary/20"
        >
          <Plus size={18} className="mr-2" />
          Novo Item
        </Button>
      </div>

      <Card className="border-border shadow-xl bg-card">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <LayoutTemplate size={16} />
            Estrutura de Navegação
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground italic">Carregando estrutura...</div>
          ) : items.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <p className="text-muted-foreground italic">Nenhum item de menu configurado.</p>
              <Button variant="outline" className="border-border" onClick={() => setFormOpen(true)}>
                Criar meu primeiro item
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="border-none">
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-border">
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="font-bold text-foreground">Item</TableHead>
                    <TableHead className="font-bold text-foreground">Link</TableHead>
                    <TableHead className="text-center font-bold text-foreground">Ordem</TableHead>
                    <TableHead className="text-right font-bold text-foreground px-8">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderRows(items)}
                </TableBody>
              </Table>
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
