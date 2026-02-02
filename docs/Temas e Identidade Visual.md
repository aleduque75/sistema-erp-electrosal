🎨 Sistema de Temas e Identidade Visual (ERP Electrosal)

Este documento descreve a arquitetura de temas do sistema, permitindo tanto a preferência individual do usuário (Claro/Escuro) quanto a personalização da marca pela organização.
🏗️ Arquitetura Geral


O sistema utiliza uma abordagem híbrida:

    Tailwind CSS (Modo Classe): Para alternância entre light e dark.

    Variáveis CSS (Tokens): Para cores dinâmicas da organização injetadas via JavaScript.

    Persistência: PostgreSQL (via Prisma) armazenando preferências em JSON.

📂 Estrutura de Dados (Prisma)

As configurações são divididas em dois modelos:

    UserSettings: Preferência individual (light, dark, system).

    AppearanceSettings: Identidade visual da empresa (armazenado como JSON estruturado).

Snippet de código

// Estrutura do JSON de customTheme
{
  "light": { "colors": { "primary": "220 100% 50%", ... } },
  "dark": { "colors": { "primary": "220 100% 50%", ... } }
}

🚀 Backend (NestJS)
Endpoints principais (/api/settings):

    GET /: Retorna as configurações do usuário logado.

    PUT /: Atualiza o tema individual (theme).

    GET /appearance: Busca as cores da organização.

    PUT /appearance: Salva o JSON de cores (Modo Claro e Escuro).

💻 Frontend (Next.js)
1. CustomThemeProvider (Context)

O "cérebro" do sistema. Ele é responsável por:

    Detectar a preferência do usuário.

    Ouvir mudanças no sistema operacional (system).

    Injetar variáveis CSS no document.documentElement em tempo real.

2. Editor de Aparência (/settings/appearance)

Uma interface administrativa que permite:

    Visualizar alterações em tempo real (Preview).

    Alternar entre abas (Modo Claro / Modo Escuro) para evitar conflitos de cores.

    Converter HEX (usuário) para HSL (Tailwind) automaticamente.

🛠️ Tecnologias Utilizadas

    React Context API: Para estado global de tema.

    Lucide React: Ícones dinâmicos.

    Sonner: Feedback visual de salvamento.

    Tailwind CSS: Utilitários de estilização.

📝 Como Adicionar Nova Cor

    Adicione a chave no objeto DEFAULT_THEME na página de aparência.

    No seu CSS/Componente, utilize a variável: bg-[var(--sua-nova-cor)].

    O sistema cuidará do mapeamento e persistência automaticamente.

Dica de ouro para o seu MD:

Se você quiser deixar esse arquivo ainda mais profissional, pode adicionar uma seção de "Troubleshooting" (Solução de Problemas) mencionando que, se as cores não mudarem, deve-se verificar se o tailwind.config.ts está com darkMode: 'class'.

Gostaria que eu gerasse um arquivo README.md completo para o seu projeto inteiro, incluindo as instruções de instalação e as tecnologias que você está usando (Next, Nest, Prisma, Docker)?

Pendendia


📂 Criação de temas

Análise do custom-theme-provider.tsx revela um sistema de tema dinâmico e backend-controlado via /settings/appearance, com
  applyColors aplicando variáveis CSS HSL ao document.documentElement. Identifiquei a necessidade de entender a estrutura do
  customThemeData e seu armazenamento no backend via modelo AppearanceSettings. A AppearancePage.tsx precisará de uma interface para
  gerenciar esses dados, mantendo a hierarquia de aplicação do tema. Próximo passo é analisar
  apps/frontend/src/app/(protected)/(dashboard)/settings/appearance/page.tsx.

✦ O AppearancePage.tsx utiliza useTheme() para gerenciar, editar e persistir variáveis CSS HSL nos modos claro e escuro via backend.
  customTheme é central para esta customização. Minha análise revela um sistema de design robusto com tailwind.config.ts,
  globals.css, custom-theme-provider.tsx e AppearancePage.tsx. No entanto, identifiquei lacunas na eficácia das regras @layer
  components, na ausência de presets de tema e na estrutura de customTheme no backend. Agora, avançarei para a Etapa 2 do plano:
  definir e persistir presets de tema, atualizando o todo.

```bash
 ?  Edit apps/backend/prisma/schema.prisma: enum TransacaoStatus {... => model ThemePreset {...                                  ← 
                                                                                                                                   
 ... first 7 lines hidden ...                                                                                                       1156 +   presetData     Json         // Armazenará o objeto { light: { colors: {...} }, dark: { colors: {...} } }                 
 1157 +   isDefault      Boolean      @default(false) // Pode ter presets padrão                                                   
 1158 +   createdAt      DateTime     @default(now())                                                                              
 1159 +   updatedAt      DateTime     @updatedAt                                                                                   
 1160 +   organization   Organization @relation(fields: [organizationId], references: [id])                                        
 1161 +                                                                                                                            
 1162 +   @@unique([organizationId, name])                                                                                         
 1163 +   @@map("theme_presets")                                                                                                   
 1164 + }                                                                                                                          
 1165 +                                                                                                                            
 1166   enum TransacaoStatus {                                                                                                     
 1167     ATIVA                                                                                                                    
 1168     AJUSTADA                                                                                                                 
                                                                                                                                   
 Apply this change?                                                                                                               
                                                                                                                                   
 ● 1. Allow once                                                                                                                   
   2. Allow for this session                                                                                                       
   3. Modify with external editor                                                                                                  
   4. No, suggest changes (esc)                                                                                                    
                                      
```



