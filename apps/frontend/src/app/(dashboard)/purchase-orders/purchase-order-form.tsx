"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import api from "@/lib/api";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Interfaces
interface FornecedorOption {
  id: string; // ID da Pessoa
  name: string; // Nome da Pessoa
  fornecedor: object; // Para indicar que tem o papel de fornecedor
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface PurchaseOrderItem {
  productId: string;
  quantity: number;
  price: number;
  // Campos opcionais para exibição no frontend
  productName?: string;
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: "PENDING" | "RECEIVED" | "CANCELED";
  orderDate: string;
  expectedDeliveryDate?: string | null;
  fornecedorId: string; // ID da Pessoa que é o fornecedor
  items: PurchaseOrderItem[];
}

interface PurchaseOrderFormProps {
  initialData?: PurchaseOrder | null;
  onSave: () => void;
}

// Schema de validação para um item
const itemSchema = z.object({
  productId: z.string().min(1, "Produto é obrigatório."),
  quantity: z.preprocess(
    (val) => Number(val),
    z.number().int().min(1, "Quantidade deve ser no mínimo 1.")
  ),
  price: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, "Preço deve ser maior que zero.")
  ),
});

// Schema de validação principal
const formSchema = z.object({
  orderNumber: z.string().min(1, "Número do pedido é obrigatório."),
  fornecedorId: z.string().min(1, "Fornecedor é obrigatório."),
  status: z.enum(["PENDING", "RECEIVED", "CANCELED"]),
  orderDate: z.string().min(1, "Data do pedido é obrigatória."),
  expectedDeliveryDate: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1, "Pelo menos um item é obrigatório."),
});

type FormValues = z.infer<typeof formSchema>;

export function PurchaseOrderForm({ initialData, onSave }: PurchaseOrderFormProps) {
  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [items, setItems] = useState<PurchaseOrderItem[]>(initialData?.items || []);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderNumber: "",
      fornecedorId: "",
      status: "PENDING",
      items: [],
      ...initialData,
      orderDate: initialData?.orderDate ? new Date(initialData.orderDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      expectedDeliveryDate: initialData?.expectedDeliveryDate ? new Date(initialData.expectedDeliveryDate).toISOString().split("T")[0] : "",
    },
  });

  const { reset, setValue, watch } = form;

  // Calcula o totalAmount dinamicamente
  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  useEffect(() => {
    // Buscar fornecedores e produtos na montagem do componente
    api.get("/pessoas?role=FORNECEDOR").then((res) => {
      setFornecedores(res.data.filter((p: any) => p.fornecedor).map((p: any) => ({
        id: p.id,
        name: p.name,
        fornecedor: p.fornecedor
      })));
    });

    api.get("/products").then((res) => {
      const mappedProducts = res.data.map((p: any) => ({
        id: p._id,
        name: p.props.name,
        price: p.props.price,
      }));
      setProducts(mappedProducts);
    }).finally(() => {
      setIsLoadingProducts(false);
    });
  }, []); // Executa apenas uma vez

  useEffect(() => {
    // Reage a mudanças nos dados iniciais ou quando os produtos são carregados
    if (initialData) {
      reset({
        ...initialData,
        orderDate: initialData.orderDate ? new Date(initialData.orderDate).toISOString().split("T")[0] : "",
        expectedDeliveryDate: initialData.expectedDeliveryDate ? new Date(initialData.expectedDeliveryDate).toISOString().split("T")[0] : "",
      });

      // Popula os itens com os nomes dos produtos para exibição,
      // somente se os produtos já foram carregados.
      if (products.length > 0) {
        setItems(initialData.items.map(item => ({
          ...item,
          productName: products.find(p => p.id === item.productId)?.name || "Produto Desconhecido"
        })));
      }
    }
  }, [initialData, products, reset]); // Depende de initialData, products e reset

  const handleAddItem = (item: PurchaseOrderItem) => {
    setItems((prev) => {
      const newItems = [...prev, item];
      form.setValue("items", newItems); // Atualiza o campo 'items' do formulário
      return newItems;
    });
    setIsItemModalOpen(false);
  };

  const handleEditItem = (index: number, updatedItem: PurchaseOrderItem) => {
    setItems((prev) => {
      const newItems = prev.map((item, i) => (i === index ? updatedItem : item));
      form.setValue("items", newItems); // Atualiza o campo 'items' do formulário
      return newItems;
    });
    setIsItemModalOpen(false);
    setEditingItemIndex(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => {
      const newItems = prev.filter((_, i) => i !== index);
      form.setValue("items", newItems); // Atualiza o campo 'items' do formulário
      return newItems;
    });
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        ...data,
        orderDate: new Date(data.orderDate).toISOString(),
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate).toISOString() : null,
        items: items.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.price }))
      };

      if (initialData) {
        await api.patch(`/purchase-orders/${initialData.id}`, payload);
        toast.success("Pedido de compra atualizado com sucesso!");
      } else {
        await api.post("/purchase-orders", payload);
        toast.success("Pedido de compra criado com sucesso!");
      }
      onSave();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Ocorreu um erro.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Campos principais do Pedido de Compra */}
        <FormField
          control={form.control}
          name="orderNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número do Pedido</FormLabel>
              <FormControl>
                <Input placeholder="Ex: PO-2023-001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="fornecedorId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fornecedor</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {fornecedores.map((fornecedor) => (
                    <SelectItem key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="RECEIVED">Recebido</SelectItem>
                  <SelectItem value="CANCELED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="orderDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do Pedido</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="expectedDeliveryDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Entrega Prevista</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Seção de Itens do Pedido */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-medium mb-4">Itens do Pedido</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Preço Unitário</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum item adicionado.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.productName}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.price.toFixed(2)}</TableCell>
                    <TableCell>{(item.quantity * item.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingItemIndex(index);
                          setIsItemModalOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-4">
            <Button
              type="button"
              onClick={() => setIsItemModalOpen(true)}
              disabled={isLoadingProducts}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {isLoadingProducts ? "Carregando..." : "Adicionar Item"}
            </Button>
          </div>
          <div className="text-right text-lg font-bold mt-4">
            Total do Pedido: {totalAmount.toFixed(2)}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Salvando..." : "Salvar Pedido"}
          </Button>
        </div>
      </form>

      {/* Modal para Adicionar/Editar Item */}
      <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItemIndex !== null ? "Editar Item" : "Adicionar Novo Item"}</DialogTitle>
            <DialogDescription>
              Selecione um produto e defina a quantidade e o preço.
            </DialogDescription>
          </DialogHeader>
          <ItemForm
            products={products}
            isLoading={isLoadingProducts}
            onSave={editingItemIndex !== null ? handleEditItem.bind(null, editingItemIndex) : handleAddItem}
            initialData={editingItemIndex !== null ? items[editingItemIndex] : undefined}
            onCancel={() => {
              setIsItemModalOpen(false);
              setEditingItemIndex(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </Form>
  );
}

// Componente de Formulário de Item (interno)
interface ItemFormProps {
  products: Product[];
  isLoading: boolean;
  onSave: (item: PurchaseOrderItem) => void;
  onCancel: () => void;
  initialData?: PurchaseOrderItem;
}

function ItemForm({ products, isLoading, onSave, onCancel, initialData }: ItemFormProps) {
  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: initialData || { productId: "", quantity: 1, price: 0 },
  });

  const onSubmit = (data: z.infer<typeof itemSchema>) => {
    const selectedProduct = products.find(p => p.id === data.productId);
    onSave({
      ...data,
      productName: selectedProduct?.name || "Produto Desconhecido",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="productId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produto</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>
                      Carregando...
                    </SelectItem>
                  ) : products.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      Nenhum produto encontrado.
                    </SelectItem>
                  ) : (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantidade</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço Unitário</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">Salvar Item</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
