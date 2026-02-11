
"use client";

import { PlusCircle, MoreHorizontal, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { toast } from "sonner"; // Importar toast diretamente do sonner
import api from "@/lib/api"; // Import the configured axios instance
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"; // Importar dnd

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  observation?: string; // Novo campo
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<TaskPriority>("MEDIUM");
  const [newObservation, setNewObservation] = useState(""); // Novo estado para o modal de adição
  const [editStatus, setEditStatus] = useState<TaskStatus>("TODO");
  const [editPriority, setEditPriority] = useState<TaskPriority>("MEDIUM");
  const [editObservation, setEditObservation] = useState(""); // Novo estado

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Lógica para reordenar tarefas dentro da mesma coluna (ainda não implementado)
    // Lógica para mover tarefas entre colunas e atualizar o status
    console.log("Task moved:", draggableId, "from", source.droppableId, "to", destination.droppableId);

    // Atualiza o estado local das tarefas imediatamente para feedback visual
    setTasks((prevTasks) => {
      const updatedTasks = Array.from(prevTasks);
      const taskToMove = updatedTasks.find(task => task.id === draggableId);

      if (!taskToMove) {
        return prevTasks;
      }

      const oldStatus = source.droppableId as TaskStatus;
      const newStatus = destination.droppableId as TaskStatus;

      if (oldStatus === newStatus) {
        // Reordenação dentro da mesma coluna (ainda não implementado)
        // ...
      } else {
        // Mover entre colunas
        taskToMove.status = newStatus;
      }
      return updatedTasks;
    });

    // Chama a API para atualizar o status no backend
    updateTaskStatusInBackend(draggableId, destination.droppableId as TaskStatus);
  };

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/tasks");
      setTasks(response.data);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message?.toString() || 'Ocorreu um erro desconhecido.', {
        title: "Erro",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async () => {
    try {
      await api.post("/tasks", {
        title: newTitle,
        priority: newPriority,
        observation: newObservation, // Adicionado
      });
      toast.success("Tarefa adicionada com sucesso.", {
        title: "Sucesso",
      });
      setIsAddModalOpen(false);
      setNewTitle("");
      setNewObservation(""); // Resetar o campo
      fetchTasks(); // Adicionado
    } catch (err: any) {
            toast.error(err.message?.toString() || 'Ocorreu um erro desconhecido.', {
              title: "Erro",
            });
          }
        };
  const handleEditTask = async () => {
    if (!currentTask) return;
    try {
      await api.patch(`/tasks/${currentTask.id}`, {
        status: editStatus,
        priority: editPriority,
        observation: editObservation, // Adicionado
      });
      toast.success("Tarefa atualizada com sucesso.", {
        title: "Sucesso",
      });
      setIsEditModalOpen(false);
      fetchTasks(); // Adicionado
    } catch (err: any) {
      toast.error(err.message?.toString() || 'Ocorreu um erro desconhecido.', {
        title: "Erro",
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      toast.success("Tarefa excluída com sucesso.", {
        title: "Sucesso",
      });
      fetchTasks();
    } catch (err: any) {
      toast.error(err.message?.toString() || 'Ocorreu um erro desconhecido.', {
        title: "Erro",
      });
    }
  };

  const updateTaskStatusInBackend = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      toast.success("Status da tarefa atualizado com sucesso.", {
        title: "Sucesso",
      });
      fetchTasks(); // Adicionado para reordenar a UI caso o status mude
    } catch (err: any) {
      toast.error(err.message?.toString() || 'Ocorreu um erro desconhecido.', {
        title: "Erro",
      });
      fetchTasks();
    }
  };

  const getStatusBadgeClass = (status: TaskStatus) => {
    switch (status) {
      case "TODO":
        return "border-yellow-500 text-yellow-500";
      case "IN_PROGRESS":
        return "border-blue-500 text-blue-500";
      case "DONE":
        return "border-green-500 text-green-500";
      default:
        return "";
    }
  };

  const getPriorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "URGENT":
        return "bg-purple-100 text-purple-800";
      default:
        return "";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Carregando tarefas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        <p>Erro ao carregar tarefas: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Tarefas</CardTitle>
              <CardDescription>
                Gerencie suas tarefas. Você pode adicionar, editar e excluir tarefas.
              </CardDescription>
              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" className="h-8 gap-1" onClick={() => setIsAddModalOpen(true)}>
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Adicionar Tarefa
                  </span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {["TODO", "IN_PROGRESS", "DONE"].map((statusKey) => {
                    const status = statusKey as TaskStatus;
                    return (
                      <div key={status} className="flex flex-col gap-2">
                        <h2 className="text-lg font-semibold">{status.replace('_', ' ')}</h2>
                        <Droppable droppableId={status}>
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="bg-card p-2 rounded-md min-h-[200px]"
                            >
                              {tasks
                                .filter((task) => task.status === status)
                                .map((task, index) => (
                                  <Draggable key={task.id} draggableId={task.id} index={index}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="mb-2"
                                      >
                                        <Card className="shadow-md">
                                          <CardHeader className="p-3 pb-1">
                                            <CardTitle className="text-sm">
                                              {task.title}
                                            </CardTitle>
                                            <CardDescription className="text-xs">
                                              #{task.id.substring(0, 8)} - {task.createdBy?.name || 'Desconhecido'}
                                            </CardDescription>
                                          </CardHeader>
                                          <CardContent className="p-3 pt-0 flex justify-between items-center text-xs">
                                            <Badge variant="secondary" className={getPriorityBadgeClass(task.priority)}>
                                              {task.priority}
                                            </Badge>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  aria-haspopup="true"
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-6 w-6"
                                                >
                                                  <MoreHorizontal className="h-3 w-3" />
                                                  <span className="sr-only">Toggle menu</span>
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end" className="bg-card text-foreground">
                                                <DropdownMenuItem
                                                  onClick={() => {
                                                    setCurrentTask(task);
                                                    setEditStatus(task.status);
                                                    setEditPriority(task.priority);
                                                    setEditObservation(task.observation || ""); // Adicionado
                                                    setIsEditModalOpen(true);
                                                  }}
                                                >
                                                  Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDeleteTask(task.id)}>
                                                  Excluir
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </CardContent>
                                        </Card>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    );
                  })}
                </div>
              </DragDropContext>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add Task Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Adicionar Nova Tarefa</DialogTitle>
            <DialogDescription>
              Preencha os detalhes para adicionar uma nova tarefa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Título
              </Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">
                Prioridade
              </Label>
              <Select
                value={newPriority}
                onValueChange={(value: TaskPriority) => setNewPriority(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a Prioridade" />
                </SelectTrigger>
                <SelectContent className="bg-card text-foreground">
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Adicionando o campo de observações */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="observation" className="text-right">
                Observações
              </Label>
              <textarea
                id="observation"
                value={newObservation}
                onChange={(e) => setNewObservation(e.target.value)}
                className="col-span-3 border p-2 rounded-md min-h-[80px] bg-card text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTask}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
            <DialogDescription>
              Edite o status e a prioridade da tarefa.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-title" className="text-right">
                Título
              </Label>
              <Input
                id="edit-title"
                value={currentTask?.title}
                className="col-span-3"
                disabled
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status
              </Label>
              <Select
                value={editStatus}
                onValueChange={(value: TaskStatus) => setEditStatus(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o Status" />
                </SelectTrigger>
                <SelectContent className="bg-card text-foreground">
                  <SelectItem value="TODO">A Fazer</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                  <SelectItem value="DONE">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Adicionando o campo de prioridade novamente */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-priority" className="text-right">
                Prioridade
              </Label>
              <Select
                value={editPriority}
                onValueChange={(value: TaskPriority) => setEditPriority(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a Prioridade" />
                </SelectTrigger>
                <SelectContent className="bg-card text-foreground">
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Adicionando o campo de observações */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-observation" className="text-right">
                Observações
              </Label>
              <textarea
                id="edit-observation"
                value={editObservation}
                onChange={(e) => setEditObservation(e.target.value)}
                className="col-span-3 border p-2 rounded-md min-h-[80px] bg-card text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditTask}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
