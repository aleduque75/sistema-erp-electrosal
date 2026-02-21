---
description: Como implementar e manter o Super Manager de Aparência do ERP Electrosal (customização de temas, cores, CSS vars e persistência)
---

# Super Manager de Aparência — Guia de Implementação e Manutenção

Este workflow documenta a implementação completa do sistema de personalização visual do ERP, incluindo a página "Super Manager", o tema customizável e a lógica de persistência.

---

## 1. Arquitetura do Sistema de Temas

### Arquivos Principais
| Arquivo | Responsabilidade |
|---|---|
| `apps/frontend/src/components/providers/custom-theme-provider.tsx` | Provedor de contexto de tema. Define `DEFAULT_THEME`, `applyColors`, e expõe `useTheme()`. |
| `apps/frontend/src/app/(protected)/(dashboard)/settings/appearance/page.tsx` | Página Super Manager de Aparência. |
| `apps/frontend/src/app/globals.css` | Variáveis CSS base e classes de componentes. |
| `apps/frontend/src/lib/colors.ts` | Utilitários `hslToHex()` e `hexToHsl()`. |
| `apps/frontend/src/components/ui/slider.tsx` | Componente Slider baseado em `@radix-ui/react-slider`. |
| `apps/backend/src/settings/settings.service.ts` | Lógica de `getAppearanceSettings` e `updateAppearanceSettings`. |
| `apps/backend/src/settings/settings.controller.ts` | Rotas: `GET/PUT /settings/appearance`, `POST/GET/PUT/DELETE /settings/themes`. |
| `apps/backend/src/organization/dto/update-appearance-settings.dto.ts` | DTO com `customTheme`, `sidebarTheme`, `themeName`, `logoId`. |

---

## 2. Como Adicionar Novas Variáveis de Cor

1. **Adicione ao `DEFAULT_THEME`** em `custom-theme-provider.tsx` (tanto em `light.colors` quanto em `dark.colors`):
   ```ts
   export const DEFAULT_THEME = {
     light: { colors: { "nova-variavel": "hsl_value_aqui" } },
     dark:  { colors: { "nova-variavel": "hsl_value_dark_aqui" } },
   };
   ```

2. **Declare a variável no `globals.css`**:
   ```css
   :root {
     --nova-variavel: hsl(0 0% 100%);
   }
   ```

3. **Exponha na página de Aparência** (`page.tsx`) adicionando um `<ColorRow>` na categoria correta:
   ```tsx
   <ColorRow label="Minha Nova Cor" mode={currentMode} k="nova-variavel" v={config[currentMode]?.colors?.["nova-variavel"]} onChange={update} />
   ```

> ⚠️ **Atenção ao formato das chaves:** O banco salva em `camelCase` (`cardBorder`), mas as variáveis CSS usam `kebab-case` (`--card-border`). A função `applyColors` faz esta conversão automaticamente. Se adicionar chaves compostas como `myNewColorVar`, a variável CSS resultante será `--my-new-color-var`.

---

## 3. Fluxo de Persistência (Caminho Completo)

```
Usuário edita cor → update(mode, key, hexValue)
  → hexToHsl(hex) → armazena como "H S% L%" no estado local
  → updateLiveColors(colors) → applyColors(colors) → CSS var atualizada em tempo real

Usuário clica "Salvar" → handleSaveAll()
  → api.put('/settings/appearance', { customTheme: config, themeName: theme })
  → SettingsService.updateAppearanceSettings(orgId, dto)
  → prisma.appearanceSettings.upsert(...)
  → ✅ Dados salvos em JSON no banco (chaves em camelCase)

Após Refresh → ThemeProvider init()
  → api.get('/settings/appearance')
  → getAppearanceSettings(orgId)
  → Merge com DEFAULT_THEME (para garantir variáveis novas não fiquem vazias)
  → applyColors(merged.colors) → converte camelCase → kebab-case → aplica CSS vars
```

---

## 4. Categorias de Customização da Página

| Tab | Descrição | Chaves Principais |
|---|---|---|
| `general` | Identidade Visual | `background`, `primary`, `secondary`, `accent`, `muted`, `ring` |
| `structure` | Cards & Containers | `card`, `cardForeground`, `cardBorder`, `cardBorderOpacity`, `cardRadius` |
| `typography` | Texto & Tipografia | `foreground`, `mutedForeground`, `destructiveForeground`, `primaryForeground` |
| `tables` | Listas & Tabelas | `tableBorder`, `tableHeaderBackground`, `tableHeaderForeground`, `tableRowHover` |
| `buttons` | Botões & Cliques | `primary`, `primaryHover`, `cancel`, `cancelHover`, `buttonRadius` |
| `feedback` | Feedback & Status | `success`, `warning`, `destructive` |
| `menu` | Menu & Navegação | `menuBackground`, `menuText`, `menuBorder`, `menuBgHover`, `menuSelectedBackground`, `menuSelectedText`, `menuItemRadius` |

---

## 5. Componentes Auxiliares na Página

- **`<ColorRow />`**: Input de cor (color picker + preview). Converte HEX ↔ HSL.
- **`<SliderRow />`**: Slider de 0–100% para opacidade de bordas.
- **`<RadiusRow />`**: Slider de 0–40px para arredondamento.
- **`<SettingSection />`**: Card com título/descrição que encapsula um grupo de controles.
- **`<CategoryItem />`**: Botão de navegação lateral entre categorias.

---

## 6. Presets de Temas

- **Salvar preset**: `POST /settings/themes` com `{ name, presetData: config }`
- **Aplicar preset**: Atualiza o estado local com `setConfig(preset.presetData)`
- **Deletar preset**: `DELETE /settings/themes/:id`
- **Editar nome**: `PUT /settings/themes/:id`

---

## 7. Instalar Dependências Necessárias

```bash
# Slider Radix UI (necessário para SliderRow e RadiusRow)
pnpm --filter frontend add @radix-ui/react-slider
```

---

## 8. Rebuild e Restart após Alterações

```bash
# Rebuild do frontend
pnpm --filter frontend build

# Rebuild do backend
pnpm --filter backend build

# Restart dos serviços de homologação
pm2 restart erp-frontend-homolog erp-backend-homolog

# Verificar status
pm2 list
```

---

## 9. Depurar Problemas de Persistência

```bash
# Verificar o que está salvo no banco
PGPASSWORD='Electrosal123' psql -h 172.17.0.1 -U admin -d erp_homolog \
  -c "SELECT id, \"themeName\", (\"customTheme\" IS NOT NULL) as has_theme FROM erp.\"AppearanceSettings\";"

# Ver logs do backend de homologação em tempo real
pm2 log erp-backend-homolog --lines 100 --no-daemon
```

### Problemas Comuns

| Sintoma | Causa | Solução |
|---|---|---|
| Cores somem após refresh | `applyColors` não converte `camelCase → kebab-case` corretamente | Verificar a função `applyColors` no `custom-theme-provider.tsx` |
| Salvamento não persiste | `organizationId` ausente no token JWT | Verificar `jwt-auth.guard.ts` e o claim `orgId` no token |
| Novas variáveis não aparecem | `DEFAULT_THEME` não atualizado | Adicionar a variável no `DEFAULT_THEME` (light e dark) |
| Slider não funciona | `@radix-ui/react-slider` não instalado | `pnpm --filter frontend add @radix-ui/react-slider` |
