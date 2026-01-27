"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Edit, Trash2, GripVertical } from "lucide-react"; // Import GripVertical for drag handle
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

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

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await api.get('/menu');
      if (response.status === 200) {
        const data = response.data.menuItems;
        // Filter and sort top-level items, then recursively build sub-items
        const buildHierarchy = (items: MenuItem[], parentId: string | null = null): MenuItem[] => {
          return items
            .filter(item => item.parentId === parentId)
            .sort((a, b) => a.order - b.order)
            .map(item => ({
              ...item,
              subItems: buildHierarchy(items, item.id),
            }));
        };
        setMenuItems(buildHierarchy(data));
      } else {
        console.error("Failed to fetch menu items");
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este item de menu e todos os seus sub-itens?")) {
      try {
        const response = await api.delete(`/menu/${id}`);
        if (response.status === 200) {
          fetchMenu(); // Re-fetch menu after deletion
        } else {
          console.error("Failed to delete menu item");
        }
      } catch (error) {
        console.error("Error deleting menu item:", error);
      }
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) {
      return; // Dropped outside a droppable
    }

    // Only reorder top-level items for now
    if (result.source.droppableId !== "top-level-menu") {
      return; // Only handling top-level drag-and-drop
    }

    const reorderedItems = Array.from(menuItems);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    setMenuItems(reorderedItems); // Optimistic update

    // Update backend with new order
    try {
      for (let i = 0; i < reorderedItems.length; i++) {
        const item = reorderedItems[i];
        if (item.order !== i) { // Only update if order has changed
          await api.patch(`/menu/${item.id}`, { order: i });
        }
      }
      // Re-fetch to ensure consistency (especially if sub-items also had order changes, not handled here yet)
      // fetchMenu(); // Optional: uncomment if full re-fetch is desired
    } catch (error) {
      console.error("Error updating menu item order:", error);
      fetchMenu(); // Revert optimistic update on error
    }
  };


  const renderNestedMenuItems = (items: MenuItem[], level: number = 0) => {
    return items.map((item) => (
      <React.Fragment key={item.id}>
        <div
          className={`flex items-center justify-between p-2 border-b last:border-b-0 ${
            level > 0 ? `ml-${level * 4}` : "" // Indent sub-items
          }`}
        >
          <div className="flex items-center space-x-2">
            {/* Display the icon if available */}
            {item.icon && (<span className="text-gray-500"><GripVertical className="inline-block h-4 w-4 mr-2 opacity-0" /></span>)} {/* Placeholder for consistent spacing */}
            <span>{item.title}</span>
            <span className="text-sm text-muted-foreground">({item.href})</span>
            {item.disabled && <span className="text-xs text-red-500">(Desabilitado)</span>}
          </div>
          <div className="flex space-x-2">
            <Link href={`/admin/menu/${item.id}`}>
              <Button variant="outline" size="icon">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {item.subItems && item.subItems.length > 0 && (
          <div>{renderNestedMenuItems(item.subItems, level + 1)}</div>
        )}
      </React.Fragment>
    ));
  };


  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gerenciar Menu</CardTitle>
          <Link href="/admin/menu/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Item
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Carregando menu...</div>
          ) : menuItems.length > 0 ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="top-level-menu">
                {(provided) => (
                  <div
                    className="border rounded-md"
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {menuItems.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={snapshot.isDragging ? "bg-accent" : ""} // Highlight dragged item
                          >
                            <div
                              className={`flex items-center justify-between p-2 border-b last:border-b-0`}
                            >
                              <div className="flex items-center space-x-2">
                                <span {...provided.dragHandleProps} className="cursor-grab text-gray-500">
                                  <GripVertical className="inline-block h-4 w-4 mr-2" />
                                </span>
                                <span>{item.title}</span>
                                <span className="text-sm text-muted-foreground">({item.href})</span>
                                {item.disabled && <span className="text-xs text-red-500">(Desabilitado)</span>}
                              </div>
                              <div className="flex space-x-2">
                                <Link href={`/admin/menu/${item.id}`}>
                                  <Button variant="outline" size="icon">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleDelete(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {item.subItems && item.subItems.length > 0 && (
                              <div className="ml-4">{renderNestedMenuItems(item.subItems, 1)}</div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <p>Nenhum item de menu encontrado. Adicione um para começar.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}