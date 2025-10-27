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
import { Combobox } from "@/components/ui/combobox";
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
interface RawMaterial {
  id: string;
  name: string;
  cost: number;
}

interface PaymentTerm {
  id: string;
  name: string;
}

interface PurchaseOrderItem {
  productId?: string;
  rawMaterialId?: string;
  quantity: number;
  price: number;
  // Campos opcionais para exibição no frontend
  productName?: string;
  rawMaterialName?: string;
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
  itemType: z.enum(["PRODUCT", "RAW_MATERIAL"]),
  productId: z.string().optional(),
  rawMaterialId: z.string().optional(),
  quantity: z.preprocess(
    (val) => Number(val),
    z.number().int().min(1, "Quantidade deve ser no mínimo 1.")
  ),
  price: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, "Preço deve ser maior que zero.")
  ),
}).refine(data => {
  if (data.itemType === 'PRODUCT') return !!data.productId;
  if (data.itemType === 'RAW_MATERIAL') return !!data.rawMaterialId;
  return false;
}, {
  message: "Selecione um produto ou matéria-prima.",
  path: ["productId"], // ou rawMaterialId, o path é mais para referência
});


// Schema de validação principal
const formSchema = z.object({
  orderNumber: z.string().min(1, "Número do pedido é obrigatório."),
  fornecedorId: z.string().min(1, "Fornecedor é obrigatório."),
  paymentTermId: z.string().optional().nullable(),
  status: z.enum(["PENDING", "RECEIVED", "CANCELED"]),
  orderDate: z.string().min(1, "Data do pedido é obrigatória."),
  expectedDeliveryDate: z.string().optional().nullable(),
  items: z.array(itemSchema).min(1, "Pelo menos um item é obrigatório."),
});

type FormValues = z.infer<typeof formSchema>;

export function PurchaseOrderForm({ initialData, onSave }: PurchaseOrderFormProps) {
  const [fornecedores, setFornecedores] = useState<FornecedorOption[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    Promise.all([
      api.get("/pessoas?role=FORNECEDOR"),
      api.get("/products"),
      api.get("/raw-materials"),
      api.get('/payment-terms'),
    ]).then(([fornecedoresRes, productsRes, rawMaterialsRes, paymentTermsRes]) => {
      setFornecedores(fornecedoresRes.data.map((p: any) => ({ id: p.id, name: p.name })));
      setProducts(productsRes.data.map((p: any) => ({ id: p.id, name: p.name, price: p.price })));
      setRawMaterials(rawMaterialsRes.data.map((r: any) => ({ id: r.id, name: r.name, cost: r.cost })));
      setPaymentTerms(paymentTermsRes.data);
    }).catch(() => {
      toast.error("Falha ao carregar dados iniciais.");
    }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        orderDate: initialData.orderDate ? new Date(initialData.orderDate).toISOString().split("T")[0] : "",
        expectedDeliveryDate: initialData.expectedDeliveryDate ? new Date(initialData.expectedDeliveryDate).toISOString().split("T")[0] : "",
      });

      if (products.length > 0 && rawMaterials.length > 0) {
        const mappedItems = initialData.items.map(item => ({
          ...item,
          price: Number(item.price),
          itemType: item.productId ? "PRODUCT" : "RAW_MATERIAL",
          productName: products.find(p => p.id === item.productId)?.name,
          rawMaterialName: rawMaterials.find(r => r.id === item.rawMaterialId)?.name,
        }));
        setItems(mappedItems);
        form.setValue("items", mappedItems as any);
      }
    }
  }, [initialData, products, rawMaterials, reset]);

  const handleAddItem = (item: PurchaseOrderItem) => {
    setItems((prev) => {
      const newItems = [...prev, item];
      form.setValue("items", newItems as any);
      return newItems;
    });
    setIsItemModalOpen(false);
  };

  const handleEditItem = (index: number, updatedItem: PurchaseOrderItem) => {
    setItems((prev) => {
      const newItems = prev.map((item, i) => (i === index ? updatedItem : item));
      form.setValue("items", newItems as any);
      return newItems;
    });
    setIsItemModalOpen(false);
    setEditingItemIndex(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => {
      const newItems = prev.filter((_, i) => i !== index);
      form.setValue("items", newItems as any);
      return newItems;
    });
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const payload = {
        ...data,
        orderDate: new Date(data.orderDate).toISOString(),
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate).toISOString() : null,
        items: items.map(item => ({
          productId: item.productId,
          rawMaterialId: item.rawMaterialId,
          quantity: item.quantity,
          price: item.price
        }))
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
              <FormControl>
                <Combobox
                  options={fornecedores.map(fornecedor => ({ value: fornecedor.id, label: fornecedor.name }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Selecione um fornecedor"
                  searchPlaceholder="Buscar fornecedor..."
                  emptyText="Nenhum fornecedor encontrado."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentTermId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prazo de Pagamento</FormLabel>
              <Combobox
                options={paymentTerms.map(term => ({ value: term.id, label: term.name }))}
                value={field.value ?? ''}
                onChange={(value) => field.onChange(value === 'null' ? null : value)}
                placeholder="Selecione um prazo de pagamento"
                searchPlaceholder="Buscar prazo..."
                emptyText="Nenhum prazo encontrado."
              />
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
                <TableHead>Item</TableHead>
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
                    <TableCell>{item.productName || item.rawMaterialName}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{Number(item.price).toFixed(2)}</TableCell>
                    <TableCell>{(item.quantity * Number(item.price)).toFixed(2)}</TableCell>
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
              disabled={isLoading}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              {isLoading ? "Carregando..." : "Adicionar Item"}
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
              Selecione um produto ou matéria-prima e defina a quantidade e o preço.
            </DialogDescription>
          </DialogHeader>
          <ItemForm
            products={products}
            rawMaterials={rawMaterials}
            isLoading={isLoading}
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
  rawMaterials: RawMaterial[];
  isLoading: boolean;
  onSave: (item: PurchaseOrderItem) => void;
  onCancel: () => void;
  initialData?: PurchaseOrderItem;
}

function ItemForm({ products, rawMaterials, isLoading, onSave, onCancel, initialData }: ItemFormProps) {
  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: initialData ? {
      ...initialData,
      itemType: initialData.productId ? "PRODUCT" : "RAW_MATERIAL",
    } : { itemType: "PRODUCT", quantity: 1, price: 0 },
  });

  const itemType = form.watch("itemType");

  const onSubmit = (data: z.infer<typeof itemSchema>) => {
    const selectedProduct = data.itemType === "PRODUCT" ? products.find(p => p.id === data.productId) : undefined;
    const selectedRawMaterial = data.itemType === "RAW_MATERIAL" ? rawMaterials.find(r => r.id === data.rawMaterialId) : undefined;

    onSave({
      ...data,
      price: Number(data.price),
      productName: selectedProduct?.name,
      rawMaterialName: selectedRawMaterial?.name,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="itemType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Item</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PRODUCT">Produto</SelectItem>
                  <SelectItem value="RAW_MATERIAL">Matéria-Prima</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {itemType === "PRODUCT" && (
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
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
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
        )}

        {itemType === "RAW_MATERIAL" && (
          <FormField
            control={form.control}
            name="rawMaterialId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matéria-Prima</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma matéria-prima" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : (
                      rawMaterials.map((material) => (
                        <SelectItem key={material.id} value={material.id}>
                          {material.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
