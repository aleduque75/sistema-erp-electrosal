"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/providers/custom-theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { hexToHsl, hslToHex } from "@/lib/colors";
import { toast } from "sonner";
import api from "@/lib/api";

export default function AppearancePage() {
  const { theme, setTheme, updateLiveColors, setCustomTheme } = useTheme();
  const [config, setConfig] = useState<any>(null);
  const [themePresets, setThemePresets] = useState<any[]>([]);
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [isEditPresetModalOpen, setIsEditPresetModalOpen] = useState(false);
  const [currentEditingPreset, setCurrentEditingPreset] = useState<any>(null);
  const [editedPresetName, setEditedPresetName] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: appearanceSettings } = await api.get(
          `/settings/appearance?t=${Date.now()}`,
        );

        const initialConfig = appearanceSettings?.customTheme || {
          light: {
            colors: {
              borderOpacity: "1",
              tableHeaderBackground: "210 40% 96%",
              tableHeaderForeground: "215 25% 27%",
              tableRowHover: "210 40% 98%",
              tableBorder: "214 32% 91%",
            },
          },
          dark: {
            colors: {
              borderOpacity: "1",
              tableHeaderBackground: "222 47% 15%",
              tableHeaderForeground: "210 40% 98%",
              tableRowHover: "222 47% 18%",
              tableBorder: "217 33% 25%",
            },
          },
        };
        setConfig(initialConfig);

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
    if (
      !key.toLowerCase().includes("radius") &&
      !key.toLowerCase().includes("opacity")
    ) {
      const [h, s, l] = hexToHsl(val);
      final = `${h.toFixed(0)} ${s.toFixed(1)}% ${l.toFixed(1)}%`;
    }
    const next = {
      ...config,
      [mode]: {
        ...config[mode],
        colors: { ...config[mode].colors, [key]: final },
      },
    };
    setConfig(next);
    updateLiveColors(next[mode].colors);
  };

  const applyPreset = (presetData: any) => {
    if (!presetData) return;
    setConfig(presetData);
    const currentMode = theme || "light";
    if (presetData[currentMode]?.colors) {
      updateLiveColors(presetData[currentMode].colors);
    }
    toast.success("Preset carregado! Salve para aplicar.");
  };

  const handleSavePreset = async () => {
    if (!newPresetName) return;
    try {
      await api.post("/settings/themes", {
        name: newPresetName,
        presetData: config,
      });
      toast.success("Preset salvo!");
      setIsSavePresetModalOpen(false);
      setNewPresetName("");
      const { data: presets } = await api.get("/settings/themes");
      setThemePresets(presets);
    } catch (e: any) {
      toast.error("Erro ao salvar preset.");
    }
  };

  const handleUpdatePreset = async () => {
    if (!currentEditingPreset || !editedPresetName) return;
    try {
      await api.put(`/settings/themes/${currentEditingPreset.id}`, {
        name: editedPresetName,
        presetData: config, // Salva o estado atual das cores no preset
      });
      toast.success("Preset atualizado!");
      setIsEditPresetModalOpen(true);
      const { data: presets } = await api.get("/settings/themes");
      setThemePresets(presets);
      setIsEditPresetModalOpen(false);
    } catch (e: any) {
      toast.error("Erro ao atualizar preset.");
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (!confirm("Excluir este preset?")) return;
    try {
      await api.delete(`/settings/themes/${id}`);
      setThemePresets(themePresets.filter((p) => p.id !== id));
      toast.success("Excluído!");
    } catch (e: any) {
      toast.error("Erro ao excluir.");
    }
  };

  if (!config)
    return (
      <div className="p-20 text-center animate-pulse font-black">
        CARREGANDO...
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card p-6 rounded-2xl border-2 border-card-border shadow-sm">
        <h1 className="text-3xl font-black italic tracking-tighter text-foreground">
          DESIGN & EXPERIÊNCIA
        </h1>
        <Button
          size="lg"
          className="font-bold"
          onClick={() => {
            // ✅ CORREÇÃO: Enviando themeName explicitamente para o backend salvar
            const saveAppearance = api.put("/settings/appearance", {
              customTheme: config,
              themeName: theme, // Envia o modo atual (light/dark)
            });

            const saveUserPref = api.put("/settings", { theme: theme });

            Promise.all([saveAppearance, saveUserPref])
              .then(() => {
                setCustomTheme(config);
                toast.success("Identidade e Preferências Salvas!");
              })
              .catch((err) => {
                console.error("Erro ao salvar:", err);
                toast.error("Erro ao salvar configurações.");
              });
          }}
        >
          SALVAR TUDO
        </Button>
      </div>

      <Card className="card-custom shadow-sm">
        <CardHeader className="bg-muted/10 border-b py-3">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground">
            Temas Predefinidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {themePresets.map((preset: any) => (
              <div
                key={preset.id}
                className="rounded-md flex justify-between items-center bg-card text-foreground p-4 border border-card-border"
              >
                <span className="font-semibold text-foreground">
                  {preset.name}
                </span>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    size="sm"
                    onClick={() => applyPreset(preset.presetData)}
                  >
                    Aplicar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCurrentEditingPreset(preset);
                      setEditedPresetName(preset.name);
                      setIsEditPresetModalOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeletePreset(preset.id)}
                  >
                    Excluir
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setIsSavePresetModalOpen(true)}>
              Salvar Tema Atual como Novo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <Dialog
        open={isSavePresetModalOpen}
        onOpenChange={setIsSavePresetModalOpen}
      >
        <DialogContent className="bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Salvar Preset</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label>Nome do Tema</Label>
            <Input
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSavePresetModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSavePreset}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEditPresetModalOpen}
        onOpenChange={setIsEditPresetModalOpen}
      >
        <DialogContent className="bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Editar Nome</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label>Nome do Tema</Label>
            <Input
              value={editedPresetName}
              onChange={(e) => setEditedPresetName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditPresetModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdatePreset}>Atualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs value={theme} onValueChange={(v: any) => setTheme(v)}>
        <TabsList className="w-full h-12 mb-8">
          <TabsTrigger value="light" className="flex-1 font-bold">
            ☀️ MODO CLARO
          </TabsTrigger>
          <TabsTrigger value="dark" className="flex-1 font-bold">
            🌙 MODO ESCURO
          </TabsTrigger>
        </TabsList>

        {["light", "dark"].map((m) => (
          <TabsContent
            key={m}
            value={m}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <Section title="Tipografia e Campos">
              <ColorRow
                label="Texto Principal"
                m={m}
                k="foreground"
                v={config[m].colors.foreground}
                onChange={update}
              />
              <ColorRow
                label="Texto Secundário"
                m={m}
                k="mutedForeground"
                v={config[m].colors.mutedForeground}
                onChange={update}
              />
              <hr className="my-2 opacity-20" />
              <ColorRow
                label="Fundo do Input"
                m={m}
                k="input"
                v={config[m].colors.input}
                onChange={update}
              />
              <ColorRow
                label="Texto do Input"
                m={m}
                k="inputForeground"
                v={config[m].colors.inputForeground}
                onChange={update}
              />
            </Section>

            <Section title="Menu Lateral">
              <ColorRow
                label="Fundo Menu"
                m={m}
                k="menuBackground"
                v={config[m].colors.menuBackground}
                onChange={update}
              />
              <ColorRow
                label="Texto Menu"
                m={m}
                k="menuText"
                v={config[m].colors.menuText}
                onChange={update}
              />
              <ColorRow
                label="Borda de Divisão"
                m={m}
                k="menuBorder"
                v={config[m].colors.menuBorder}
                onChange={update}
              />
              <InputRow
                label="Opacidade Borda"
                m={m}
                k="menuBorderOpacity"
                v={config[m].colors.menuBorderOpacity}
                onChange={update}
              />
              <ColorRow
                label="Fundo Hover Menu"
                m={m}
                k="menuBgHover"
                v={config[m].colors.menuBgHover}
                onChange={update}
              />
              <ColorRow
                label="Fundo Item Selecionado"
                m={m}
                k="menuSelectedBackground"
                v={config[m].colors.menuSelectedBackground}
                onChange={update}
              />
              <ColorRow
                label="Texto Item Selecionado"
                m={m}
                k="menuSelectedText"
                v={config[m].colors.menuSelectedText}
                onChange={update}
              />
              <InputRow
                label="Raio Item Menu"
                m={m}
                k="menuItemRadius"
                v={config[m].colors.menuItemRadius}
                onChange={update}
              />
            </Section>

            <Section title="Estrutura de Cards">
              <ColorRow
                label="Fundo Página"
                m={m}
                k="background"
                v={config[m].colors.background}
                onChange={update}
              />
              <ColorRow
                label="Fundo Card"
                m={m}
                k="card"
                v={config[m].colors.card}
                onChange={update}
              />
              <ColorRow
                label="Borda do Card"
                m={m}
                k="cardBorder"
                v={config[m].colors.cardBorder}
                onChange={update}
              />
              <InputRow
                label="Opacidade Borda Card"
                m={m}
                k="cardBorderOpacity"
                v={config[m].colors.cardBorderOpacity}
                onChange={update}
              />
              <InputRow
                label="Raio (Radius)"
                m={m}
                k="cardRadius"
                v={config[m].colors.cardRadius}
                onChange={update}
              />
              <hr className="my-2 opacity-20" />
              <ColorRow
                label="Borda Padrão"
                m={m}
                k="border"
                v={config[m].colors.border}
                onChange={update}
              />
              <InputRow
                label="Opacidade Borda Padrão"
                m={m}
                k="borderOpacity"
                v={config[m].colors.borderOpacity}
                onChange={update}
              />
            </Section>

            <Section title="Botões">
              <ColorRow
                label="Fundo Principal"
                m={m}
                k="primary"
                v={config[m].colors.primary}
                onChange={update}
              />
              <ColorRow
                label="Texto Principal"
                m={m}
                k="primaryForeground"
                v={config[m].colors.primaryForeground}
                onChange={update}
              />
              <ColorRow
                label="Fundo Principal Hover"
                m={m}
                k="primaryHover"
                v={config[m].colors.primaryHover}
                onChange={update}
              />
              <hr className="my-2 opacity-20" />
              <ColorRow
                label="Fundo Cancelar"
                m={m}
                k="cancel"
                v={config[m].colors.cancel}
                onChange={update}
              />
              <ColorRow
                label="Texto Cancelar"
                m={m}
                k="cancelForeground"
                v={config[m].colors.cancelForeground}
                onChange={update}
              />
              <ColorRow
                label="Fundo Cancelar Hover"
                m={m}
                k="cancelHover"
                v={config[m].colors.cancelHover}
                onChange={update}
              />
              <InputRow
                label="Raio dos Botões"
                m={m}
                k="buttonRadius"
                v={config[m].colors.buttonRadius}
                onChange={update}
              />
            </Section>

            <Section title="Tabelas">
              <ColorRow
                label="Fundo Cabeçalho"
                m={m}
                k="tableHeaderBackground"
                v={config[m].colors.tableHeaderBackground}
                onChange={update}
              />
              <ColorRow
                label="Texto Cabeçalho"
                m={m}
                k="tableHeaderForeground"
                v={config[m].colors.tableHeaderForeground}
                onChange={update}
              />
              <ColorRow
                label="Fundo Hover Linha"
                m={m}
                k="tableRowHover"
                v={config[m].colors.tableRowHover}
                onChange={update}
              />
              <ColorRow
                label="Borda Tabela"
                m={m}
                k="tableBorder"
                v={config[m].colors.tableBorder}
                onChange={update}
              />
            </Section>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <Card className="shadow-sm border border-card-border">
      <CardHeader className="bg-muted/10 border-b py-3">
        <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">{children}</CardContent>
    </Card>
  );
}

function ColorRow({ label, m, v, onChange, k }: any) {
  const hex = () => {
    try {
      const p = v.replace(/%/g, "").split(" ");
      return hslToHex(p[0], p[1], p[2]);
    } catch {
      return "#000";
    }
  };
  return (
    <div className="flex items-center justify-between gap-2 p-1">
      <span className="text-[11px] font-bold text-foreground">{label}</span>
      <input
        type="color"
        value={hex()}
        onChange={(e) => onChange(m, k, e.target.value)}
        className="w-6 h-6 cursor-pointer bg-transparent border-none"
      />
    </div>
  );
}

function InputRow({ label, m, k, v, onChange }: any) {
  return (
    <div className="flex items-center justify-between gap-2 p-1">
      <span className="text-[11px] font-bold text-foreground">{label}</span>
      <input
        type="text"
        value={v}
        onChange={(e) => onChange(m, k, e.target.value)}
        className="w-16 text-right border rounded text-[10px] p-1 font-mono"
      />
    </div>
  );
}
