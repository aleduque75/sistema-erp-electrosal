"use client";

import { useEffect, useState, useMemo } from "react";
import { useTheme, DEFAULT_THEME } from "@/components/providers/custom-theme-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { hexToHsl, hslToHex } from "@/lib/colors";
import { toast } from "sonner";
import api from "@/lib/api";
import {
  Palette,
  Layout,
  Type,
  Table as TableIcon,
  MousePointer2,
  CheckCircle2,
  Info,
  Layers,
  Save,
  Plus,
  Trash2,
  Copy,
  Sun,
  Moon,
  Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppearancePage() {
  const { theme, setTheme, updateLiveColors, setCustomTheme } = useTheme();
  const [config, setConfig] = useState<any>(null);
  const [themePresets, setThemePresets] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [isEditPresetModalOpen, setIsEditPresetModalOpen] = useState(false);
  const [currentEditingPreset, setCurrentEditingPreset] = useState<any>(null);
  const [editedPresetName, setEditedPresetName] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: appearanceSettings } = await api.get(`/settings/appearance?t=${Date.now()}`);

        // MERGE com o DEFAULT_THEME para garantir que o estado local tenha todas as variáveis
        const backendTheme = appearanceSettings?.customTheme || {};
        const merged = {
          light: {
            colors: {
              ...DEFAULT_THEME.light.colors,
              ...(backendTheme.light?.colors || {})
            }
          },
          dark: {
            colors: {
              ...DEFAULT_THEME.dark.colors,
              ...(backendTheme.dark?.colors || {})
            }
          }
        };

        setConfig(merged);
        const { data: presets } = await api.get("/settings/themes");
        setThemePresets(presets);
      } catch (e) {
        console.error("Erro ao carregar:", e);
        toast.error("Erro ao carregar configurações.");
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (config) {
      const currentMode = theme || "light";
      const colors = config[currentMode]?.colors;
      if (colors) {
        updateLiveColors(colors);
      }
    }
  }, [theme, config, updateLiveColors]);

  const update = (mode: string, key: string, val: string) => {
    let final = val;
    // Se não for raio ou opacidade, converte hex para HSL string
    if (!key.toLowerCase().includes("radius") && !key.toLowerCase().includes("opacity") && !key.toLowerCase().includes("intensity")) {
      try {
        const [h, s, l] = hexToHsl(val);
        final = `${h.toFixed(0)} ${s.toFixed(1)}% ${l.toFixed(1)}%`;
      } catch (e) {
        final = val;
      }
    }

    const next = {
      ...config,
      [mode]: {
        ...config[mode],
        colors: { ...config[mode]?.colors, [key]: final },
      },
    };
    setConfig(next);

    // Se for intensidade, precisamos ajustar as cores live? 
    // Por enquanto vamos apenas atualizar o estado e o ThemeProvider cuida do resto
    updateLiveColors(next[mode].colors);
  };

  const handleSaveAll = async () => {
    try {
      await Promise.all([
        api.put("/settings/appearance", { customTheme: config, themeName: theme }),
        api.put("/settings", { theme: theme })
      ]);
      setCustomTheme(config);
      toast.success("Design do sistema atualizado com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar configurações.");
    }
  };

  if (!config) return <div className="p-20 text-center animate-pulse font-black text-2xl">CARREGANDO SUPER MANAGER...</div>;

  const currentMode = theme || "light";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header Fixo */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-4">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl text-primary-foreground">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight uppercase italic">Super Appearance Manager</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Controle total da identidade visual S23</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Tabs value={theme} onValueChange={(v: any) => setTheme(v)} className="w-[200px]">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="light"><Sun className="w-4 h-4 mr-2" /> Claro</TabsTrigger>
                <TabsTrigger value="dark"><Moon className="w-4 h-4 mr-2" /> Escuro</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button onClick={handleSaveAll} className="font-bold px-8 shadow-lg shadow-primary/20">
              <Save className="w-4 h-4 mr-2" /> SALVAR ALTERAÇÕES
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Sidebar de Categorias */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-2 shadow-sm">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2 italic">
                <Layers className="w-4 h-4" /> CATEGORIAS
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-2">
              <nav className="space-y-1">
                <CategoryItem active={activeTab === "general"} icon={<Palette className="w-4 h-4" />} label="Identidade & Cores" onClick={() => setActiveTab("general")} />
                <CategoryItem active={activeTab === "structure"} icon={<Layout className="w-4 h-4" />} label="Cards & Estrutura" onClick={() => setActiveTab("structure")} />
                <CategoryItem active={activeTab === "typography"} icon={<Type className="w-4 h-4" />} label="Texto & Tipografia" onClick={() => setActiveTab("typography")} />
                <CategoryItem active={activeTab === "tables"} icon={<TableIcon className="w-4 h-4" />} label="Listas & Tabelas" onClick={() => setActiveTab("tables")} />
                <CategoryItem active={activeTab === "buttons"} icon={<MousePointer2 className="w-4 h-4" />} label="Botões & Cliques" onClick={() => setActiveTab("buttons")} />
                <CategoryItem active={activeTab === "feedback"} icon={<CheckCircle2 className="w-4 h-4" />} label="Feedback & Status" onClick={() => setActiveTab("feedback")} />
                <CategoryItem active={activeTab === "menu"} icon={<Smartphone className="w-4 h-4" />} label="Menu & Navegação" onClick={() => setActiveTab("menu")} />
              </nav>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/30">
              <CardTitle className="text-sm font-bold italic">PRESETS DE TEMAS</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {themePresets.length === 0 && <p className="text-[10px] text-muted-foreground uppercase text-center py-4">Nenhum preset salvo</p>}
              <div className="space-y-2">
                {themePresets.map(preset => (
                  <div key={preset.id} className="group p-3 rounded-lg border bg-card hover:border-primary transition-all cursor-default flex items-center justify-between">
                    <span className="text-xs font-bold">{preset.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                        setConfig(preset.presetData);
                        toast.success(`Tema ${preset.name} aplicado!`);
                      }}><CheckCircle2 className="w-3 h-3 text-green-500" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                        setCurrentEditingPreset(preset);
                        setEditedPresetName(preset.name);
                        setIsEditPresetModalOpen(true);
                      }}><Copy className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={async () => {
                        if (confirm("Excluir tema?")) {
                          await api.delete(`/settings/themes/${preset.id}`);
                          setThemePresets(prev => prev.filter(p => p.id !== preset.id));
                        }
                      }}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full text-[10px] h-8 font-black uppercase" onClick={() => setIsSavePresetModalOpen(true)}>
                <Plus className="w-3 h-3 mr-2" /> Salvar Tema Atual
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Controles Principais */}
        <div className="lg:col-span-9 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

            {/* Painel de Edição */}
            <div className="space-y-6">
              {activeTab === "general" && (
                <SettingSection title="Identidade Visual" description="Cores base que definem o tom do seu ERP.">
                  <ColorRow label="Fundo da Aplicação" mode={currentMode} k="background" v={config[currentMode]?.colors?.background} onChange={update} />
                  <ColorRow label="Cor de Destaque (Principal)" mode={currentMode} k="primary" v={config[currentMode]?.colors?.primary} onChange={update} />
                  <SliderRow label="Intensidade da Cor (Saturação)" mode={currentMode} k="primarySaturationScale" v={config[currentMode]?.colors?.primarySaturationScale || "1"} onChange={update} />
                  <ColorRow label="Secundário" mode={currentMode} k="secondary" v={config[currentMode]?.colors?.secondary} onChange={update} />
                  <ColorRow label="Acento (Accent)" mode={currentMode} k="accent" v={config[currentMode]?.colors?.accent} onChange={update} />
                  <ColorRow label="Muted" mode={currentMode} k="muted" v={config[currentMode]?.colors?.muted} onChange={update} />
                  <ColorRow label="Anéis de Foco (Ring)" mode={currentMode} k="ring" v={config[currentMode]?.colors?.ring} onChange={update} />
                </SettingSection>
              )}

              {activeTab === "structure" && (
                <SettingSection title="Cards & Containers" description="Estilização das caixas de conteúdo.">
                  <ColorRow label="Fundo do Card" mode={currentMode} k="card" v={config[currentMode]?.colors?.card} onChange={update} />
                  <ColorRow label="Texto do Card" mode={currentMode} k="cardForeground" v={config[currentMode]?.colors?.cardForeground} onChange={update} />
                  <ColorRow label="Cor da Borda" mode={currentMode} k="cardBorder" v={config[currentMode]?.colors?.cardBorder} onChange={update} />
                  <SliderRow label="Opacidade da Borda" mode={currentMode} k="cardBorderOpacity" v={config[currentMode]?.colors?.cardBorderOpacity || "1"} onChange={update} />
                  <RadiusRow label="Arredondamento (px)" mode={currentMode} k="cardRadius" v={config[currentMode]?.colors?.cardRadius || "12px"} onChange={update} />
                  <hr className="opacity-20 my-4" />
                  <p className="text-[10px] font-black uppercase text-primary mb-3">Campos de Formulário</p>
                  <ColorRow label="Fundo do Input" mode={currentMode} k="input" v={config[currentMode]?.colors?.input} onChange={update} />
                  <ColorRow label="Texto do Input" mode={currentMode} k="inputForeground" v={config[currentMode]?.colors?.inputForeground} onChange={update} />
                </SettingSection>
              )}

              {activeTab === "typography" && (
                <SettingSection title="Texto & Tipografia" description="Controle as cores de leitura do sistema.">
                  <ColorRow label="Texto Principal" mode={currentMode} k="foreground" v={config[currentMode]?.colors?.foreground} onChange={update} />
                  <ColorRow label="Texto Muted/Secundário" mode={currentMode} k="mutedForeground" v={config[currentMode]?.colors?.mutedForeground} onChange={update} />
                  <ColorRow label="Texto Destrutivo/Erro" mode={currentMode} k="destructiveForeground" v={config[currentMode]?.colors?.destructiveForeground} onChange={update} />
                  <ColorRow label="Texto em Fundo Primário" mode={currentMode} k="primaryForeground" v={config[currentMode]?.colors?.primaryForeground} onChange={update} />
                  <hr className="opacity-20 my-4" />
                  <p className="text-[10px] font-black uppercase text-primary mb-3">Mobile & Cards Especiais</p>
                  <ColorRow label="Nome do Cliente (Mobile)" mode={currentMode} k="mobileCardTitle" v={config[currentMode]?.colors?.mobileCardTitle} onChange={update} />
                  <ColorRow label="Subtítulo/Descrição (Mobile)" mode={currentMode} k="mobileCardSubtitle" v={config[currentMode]?.colors?.mobileCardSubtitle} onChange={update} />
                  <ColorRow label="Valor Total (Mobile)" mode={currentMode} k="mobileCardValue" v={config[currentMode]?.colors?.mobileCardValue} onChange={update} />
                  <ColorRow label="Quantidade/Métrica (Mobile)" mode={currentMode} k="mobileCardQuantity" v={config[currentMode]?.colors?.mobileCardQuantity} onChange={update} />
                  <ColorRow label="Ícones do Card (Mobile)" mode={currentMode} k="mobileCardIcon" v={config[currentMode]?.colors?.mobileCardIcon} onChange={update} />
                </SettingSection>
              )}

              {activeTab === "tables" && (
                <SettingSection title="Listas & Tabelas" description="Personalize a visualização de dados.">
                  <ColorRow label="Borda das Tabelas" mode={currentMode} k="tableBorder" v={config[currentMode]?.colors?.tableBorder} onChange={update} />
                  <ColorRow label="Fundo do Cabeçalho" mode={currentMode} k="tableHeaderBackground" v={config[currentMode]?.colors?.tableHeaderBackground} onChange={update} />
                  <ColorRow label="Texto do Cabeçalho" mode={currentMode} k="tableHeaderForeground" v={config[currentMode]?.colors?.tableHeaderForeground} onChange={update} />
                  <ColorRow label="Hover da Linha" mode={currentMode} k="tableRowHover" v={config[currentMode]?.colors?.tableRowHover} onChange={update} />
                </SettingSection>
              )}

              {activeTab === "buttons" && (
                <SettingSection title="Botões & Cliques" description="Botões de ação e interação.">
                  <ColorRow label="Fundo Primário" mode={currentMode} k="primary" v={config[currentMode]?.colors?.primary} onChange={update} />
                  <ColorRow label="Fundo Primário Hover" mode={currentMode} k="primaryHover" v={config[currentMode]?.colors?.primaryHover} onChange={update} />
                  <hr className="opacity-20" />
                  <ColorRow label="Fundo Cancelar" mode={currentMode} k="cancel" v={config[currentMode]?.colors?.cancel} onChange={update} />
                  <ColorRow label="Fundo Cancelar Hover" mode={currentMode} k="cancelHover" v={config[currentMode]?.colors?.cancelHover} onChange={update} />
                  <RadiusRow label="Raio dos Botões" mode={currentMode} k="buttonRadius" v={config[currentMode]?.colors?.buttonRadius || "8px"} onChange={update} />
                </SettingSection>
              )}

              {activeTab === "feedback" && (
                <SettingSection title="Feedback & Status" description="Cores de sucesso, avisos e notificações.">
                  <ColorRow label="Sucesso (Success)" mode={currentMode} k="success" v={config[currentMode]?.colors?.success || "142 76% 36%"} onChange={update} />
                  <ColorRow label="Aviso (Warning)" mode={currentMode} k="warning" v={config[currentMode]?.colors?.warning || "38 92% 50%"} onChange={update} />
                  <ColorRow label="Erro (Destructive)" mode={currentMode} k="destructive" v={config[currentMode]?.colors?.destructive} onChange={update} />
                  <hr className="opacity-20 my-4" />
                  <p className="text-[10px] font-black uppercase text-primary mb-3">Status Específicos</p>
                  <ColorRow label="Status Finalizado (Texto)" mode={currentMode} k="statusFinalizadoText" v={config[currentMode]?.colors?.statusFinalizadoText} onChange={update} />
                  <ColorRow label="Status Finalizado (Fundo)" mode={currentMode} k="statusFinalizadoBg" v={config[currentMode]?.colors?.statusFinalizadoBg} onChange={update} />
                </SettingSection>
              )}

              {activeTab === "menu" && (
                <SettingSection title="Menu & Navegação" description="Sidebar e elementos de navegação lateral.">
                  <ColorRow label="Fundo do Menu" mode={currentMode} k="menuBackground" v={config[currentMode]?.colors?.menuBackground} onChange={update} />
                  <ColorRow label="Texto do Menu" mode={currentMode} k="menuText" v={config[currentMode]?.colors?.menuText} onChange={update} />
                  <ColorRow label="Borda do Menu" mode={currentMode} k="menuBorder" v={config[currentMode]?.colors?.menuBorder} onChange={update} />
                  <ColorRow label="Hover do Item" mode={currentMode} k="menuBgHover" v={config[currentMode]?.colors?.menuBgHover} onChange={update} />
                  <ColorRow label="Fundo Selecionado" mode={currentMode} k="menuSelectedBackground" v={config[currentMode]?.colors?.menuSelectedBackground} onChange={update} />
                  <ColorRow label="Texto Selecionado" mode={currentMode} k="menuSelectedText" v={config[currentMode]?.colors?.menuSelectedText} onChange={update} />
                  <RadiusRow label="Raio dos Itens" mode={currentMode} k="menuItemRadius" v={config[currentMode]?.colors?.menuItemRadius || "8px"} onChange={update} />
                </SettingSection>
              )}
            </div>

            {/* Live Preview Pane */}
            <div className="space-y-6 lg:sticky lg:top-[100px]">
              <Card className="border-2 shadow-xl overflow-hidden">
                <CardHeader className="bg-muted pb-3 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-black italic">PRÉ-VISUALIZAÇÃO</CardTitle>
                    <CardDescription className="text-[10px] font-bold">Real-time update S23</CardDescription>
                  </div>
                  <Smartphone className="w-5 h-5 opacity-20" />
                </CardHeader>
                <CardContent className="p-6 bg-background space-y-6">
                  {/* Exemplo de Texto */}
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">Tiulo Principal de Exemplo</p>
                    <p className="text-xs text-muted-foreground">Este é um parágrafo secundário com texto muted.</p>
                    <p className="text-xs text-destructive">Um alerta de erro ou ação crítica.</p>
                  </div>

                  {/* Exemplo de Card */}
                  <Card className="card-custom p-4 shadow-sm border">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-50">Exemplo de Card & Input</p>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold opacity-70">Nome do Cliente</Label>
                        <Input placeholder="Digite o nome..." className="h-8 text-xs" />
                      </div>
                      <p className="text-xs font-medium">Os conteúdos do sistema aparecerão dentro de containers como este.</p>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm">Ação Primária</Button>
                        <Button variant="outline" size="sm">Ação Outline</Button>
                      </div>
                    </div>
                  </Card>

                  {/* Exemplo de Tabela */}
                  <div className="border rounded-lg overflow-hidden border-[hsl(var(--table-border))]">
                    <div className="bg-[hsl(var(--table-header-background))] p-2 border-b border-[hsl(var(--table-border))]">
                      <div className="flex justify-between text-[10px] font-black uppercase text-[hsl(var(--table-header-foreground))]">
                        <span>Descrição</span>
                        <span>Valor</span>
                      </div>
                    </div>
                    <div className="p-2 space-y-2">
                      <div className="flex justify-between text-[11px] p-2 hover:bg-[hsl(var(--table-row-hover))] rounded transition-colors border-b last:border-0 border-[hsl(var(--table-border))]">
                        <span>Item de Teste 01</span>
                        <span className="font-bold">R$ 1.500,00</span>
                      </div>
                    </div>
                  </div>

                  {/* Exemplo de Feedbacks */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <div className="px-3 py-1 bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] rounded-full text-[9px] font-black uppercase">Sucesso</div>
                    <div className="px-3 py-1 bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))] rounded-full text-[9px] font-black uppercase">Aviso</div>
                    <div className="px-3 py-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-full text-[9px] font-black uppercase">Primário</div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>

      </div>

      {/* Modals para Presets */}
      <Dialog open={isSavePresetModalOpen} onOpenChange={setIsSavePresetModalOpen}>
        <DialogContent className="bg-card text-foreground">
          <DialogHeader><DialogTitle>Salvar Novo Tema</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4"><Label>Nome do Tema</Label><Input value={newPresetName} onChange={(e) => setNewPresetName(e.target.value)} placeholder="Ex: Corporativo Moderno" /></div>
          <DialogFooter><Button onClick={async () => {
            if (!newPresetName) return;
            await api.post("/settings/themes", { name: newPresetName, presetData: config });
            toast.success("Preset salvo!");
            setIsSavePresetModalOpen(false);
            setNewPresetName("");
            const { data: presets } = await api.get("/settings/themes");
            setThemePresets(presets);
          }}>SALVAR PRESET</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditPresetModalOpen} onOpenChange={setIsEditPresetModalOpen}>
        <DialogContent className="bg-card text-foreground">
          <DialogHeader><DialogTitle>Editar Nome do Tema</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4"><Label>Nome do Tema</Label><Input value={editedPresetName} onChange={(e) => setEditedPresetName(e.target.value)} /></div>
          <DialogFooter><Button onClick={async () => {
            await api.put(`/settings/themes/${currentEditingPreset.id}`, { name: editedPresetName, presetData: config });
            toast.success("Preset atualizado!");
            const { data: presets } = await api.get("/settings/themes");
            setThemePresets(presets);
            setIsEditPresetModalOpen(false);
          }}>ATUALIZAR PRESET</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryItem({ active, icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all font-medium",
        active
          ? "bg-primary text-primary-foreground shadow-md font-bold italic"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function SettingSection({ title, description, children }: any) {
  return (
    <Card className="border-2 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-md font-black italic tracking-tight">{title}</CardTitle>
        <CardDescription className="text-xs font-medium">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

function ColorRow({ label, mode, k, v, onChange }: any) {
  const hex = useMemo(() => {
    try {
      if (!v) return "#000000";
      if (v.startsWith("#")) return v;
      const p = v.replace(/%/g, "").split(" ");
      return hslToHex(parseFloat(p[0]), parseFloat(p[1]), parseFloat(p[2]));
    } catch {
      return "#000000";
    }
  }, [v]);

  return (
    <div className="flex items-center justify-between group">
      <div className="space-y-0.5">
        <span className="text-xs font-bold text-foreground block">{label}</span>
        <span className="text-[9px] font-mono text-muted-foreground uppercase">{hex} | {v || "PADRÃO"}</span>
      </div>
      <div className="relative flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg border-2 border-border shadow-inner" style={{ backgroundColor: hex }}></div>
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(mode, k, e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

function SliderRow({ label, mode, k, v, onChange }: any) {
  const numericValue = parseFloat(v) * 100;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-foreground">{label}</span>
        <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded">{Math.round(numericValue)}%</span>
      </div>
      <Slider
        value={[numericValue]}
        max={100}
        step={1}
        onValueChange={(vals) => onChange(mode, k, (vals[0] / 100).toString())}
        className="w-full"
      />
    </div>
  );
}

function RadiusRow({ label, mode, k, v, onChange }: any) {
  const numericValue = parseInt(v.replace("px", "")) || 0;
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-foreground">{label}</span>
        <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded">{numericValue}px</span>
      </div>
      <Slider
        value={[numericValue]}
        max={40}
        step={1}
        onValueChange={(vals) => onChange(mode, k, `${vals[0]}px`)}
        className="w-full"
      />
    </div>
  );
}
