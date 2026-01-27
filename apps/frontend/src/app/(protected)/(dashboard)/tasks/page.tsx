
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

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
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
  const [editStatus, setEditStatus] = useState<TaskStatus>("TODO");
  const [editPriority, setEditPriority] = useState<TaskPriority>("MEDIUM");

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
      await api.post("/tasks", { title: newTitle, priority: newPriority });
      toast.success("Tarefa adicionada com sucesso.", {
        title: "Sucesso",
      });
      setIsAddModalOpen(false);
      setNewTitle("");
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
      });
      toast.success("Tarefa atualizada com sucesso.", {
        title: "Sucesso",
      });
      setIsEditModalOpen(false);
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Criado Por</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.id.substring(0, 8)}</TableCell>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeClass(task.status)}>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getPriorityBadgeClass(task.priority)}>
                          {task.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.createdBy?.name || task.createdBy?.email || 'Desconhecido'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setCurrentTask(task);
                                setEditStatus(task.status);
                                setEditPriority(task.priority);
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Add Task Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
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
                <SelectContent>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
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
        <DialogContent>
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
                <SelectContent>
                  <SelectItem value="TODO">A Fazer</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                  <SelectItem value="DONE">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                <SelectContent>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                </SelectContent>
              </Select>
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
