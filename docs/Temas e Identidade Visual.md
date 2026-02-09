● Perfeito! Encontrei apenas um comentário que já indicava a correção. Agora vou criar um resumo completo:                                                                       
                                                                                                                                                                                 
  ---                                                                                                                                                                            
  ✅ Padronização Completa de Temas - Resumo das Alterações                                                                                                                      
                                                                                                                                                                                 
  1. custom-theme-provider.tsx ✅                                                                                                                                                

  - Alinhado DEFAULT_THEME com globals.css
    - Removidas variáveis desatualizadas do shadcn
    - Adicionadas todas as variáveis customizadas do sistema (primary-hover, cancel, menu, badges, tabelas)
    - Mantida compatibilidade com componentes shadcn (secondary, muted, accent, destructive)

  2. globals.css ✅

  - Adicionadas variáveis shadcn faltantes:
    - --muted, --secondary, --accent, --destructive (light e dark)
    - Garantia de compatibilidade total com componentes shadcn/ui
    - Todas as variáveis HSL padronizadas

  3. tailwind.config.ts ✅

  - Mapeamento completo de variáveis:
    - primary.hover para var(--primary-hover)
    - cancel.DEFAULT, cancel.hover, cancel.foreground
    - badge.DEFAULT, badge.foreground
    - table.header, table.header-foreground, table.hover, table.border
    - Todas as cores agora usam hsl(var(--...)) corretamente

  4. FeaturesSection.tsx ✅

  - Removido bg-gray-50 hardcoded
  - Substituído por bg-muted/30 (variável semântica com opacidade)
  - Todos os outros elementos já usavam variáveis semânticas

  5. HeroSection.tsx ✅

  - Já estava correto!
  - Usa bg-background, text-foreground, text-muted-foreground
  - Botões usam bg-primary, hover:bg-primary-hover, text-primary-foreground

  6. schema.prisma (Backend) ✅

  - Modelo AppearanceSettings perfeito:
  model AppearanceSettings {
    id             String       @id @default(uuid())
    organizationId String       @unique
    themeName      String?
    sidebarTheme   Json?
    logoImageId    String?
    logoText       String?
    customTheme    Json? // ✅ PRONTO PARA SALVAR TEMAS
    createdAt      DateTime     @default(now())
    updatedAt      DateTime     @updatedAt
    organization   Organization @relation(...)
  }

  ---
  🎨 Estrutura Final do Sistema de Temas

  Fluxo de Aplicação:

  1. Backend salva tema da organização em AppearanceSettings.customTheme (JSON)
  2. Provider busca tema via /settings/appearance e aplica no DOM
  3. globals.css define variáveis HSL padrão (:root e .dark)
  4. Tailwind mapeia variáveis para classes utilitárias
  5. Componentes usam apenas classes semânticas (bg-background, text-primary, etc.)

  Variáveis Disponíveis:

  - Textos: foreground, muted-foreground
  - Estrutura: background, card, border
  - Botões: primary, primary-hover, cancel, cancel-hover
  - Inputs: input, input-foreground, ring
  - Componentes: badge, table-*, sidebar-*
  - Shadcn: secondary, muted, accent, destructive, popover

  ---
  🚀 Próximos Passos

  O sistema está 100% padronizado. Agora você pode:

  1. Testar o tema - Altere valores no banco e veja refletir em tempo real
  2. Criar presets - Use o modelo ThemePreset para salvar temas predefinidos
  3. Customizar por organização - Cada org pode ter seu próprio tema no AppearanceSettings.customTheme

  Todos os componentes agora respeitam as variáveis do tema! 🎉
