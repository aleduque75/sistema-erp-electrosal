# Documentação do Sistema de Estilos (Frontend)

## Visão Geral
O sistema de estilos do frontend utiliza Tailwind CSS com customização via variáveis CSS para suportar temas dinâmicos (claro, escuro e variantes coloridas). O ThemeProvider aplica as variáveis de cor no `<html>` globalmente, permitindo que utilitários do Tailwind usem essas variáveis para estilização consistente.

---

## Estrutura dos Arquivos

- **tailwind.config.ts**
  - Define as cores do Tailwind usando variáveis CSS (ex: `background: 'hsl(var(--background))'`).
  - Mapeia cores customizadas (brand, gray, etc) para variáveis CSS (ex: `brand-500: 'var(--color-brand-500')`).
  - Permite que utilitários como `bg-background`, `border-border`, `bg-card`, etc., usem as cores do tema ativo.

- **src/config/themes.ts**
  - Define todos os temas disponíveis (light, dark, fuchsia, etc).
  - Cada tema tem um objeto `colors` com valores HSL (ex: `'card': '240 10% 3.9%'`).
  - O ThemeProvider aplica essas cores como variáveis CSS no `<html>`.

- **src/contexts/ThemeContext.tsx**
  - Componente React que controla o tema ativo.
  - Aplica as variáveis CSS do tema selecionado no `<html>`.
  - Permite alternar entre temas e modos (claro/escuro).

- **src/app/globals.css**
  - Define variáveis CSS base (ex: `--color-brand-500: #465fff;`).
  - Define utilitários e componentes customizados com `@apply` (ex: `.menu-item`, `.card`).
  - Usa utilitários Tailwind que dependem das variáveis CSS do tema.

---

## Como funciona na prática

1. **Definição dos Temas**
   - Cada tema em `themes.ts` define um conjunto de cores (background, card, border, etc) em formato HSL.
   - Exemplo:
     ```ts
     dark: {
       colors: {
         background: '240 10% 3.9%',
         card: '240 10% 3.9%',
         border: '240 3.7% 15.11% / 0.5',
         // ...
       }
     }
     ```

2. **Aplicação das Variáveis CSS**
   - O ThemeProvider aplica cada cor do tema como variável CSS no `<html>`:
     ```css
     --background: 240 10% 3.9%;
     --card: 240 10% 3.9%;
     --border: 240 3.7% 15.11% / 0.5;
     ```
   - O Tailwind lê essas variáveis para utilitários como `bg-background`, `bg-card`, `border-border`.

3. **Uso no CSS/JSX**
   - Use utilitários Tailwind normalmente:
     ```jsx
     <div className="bg-card border border-border text-card-foreground" />
     ```
   - Para componentes customizados, use classes como `.menu-item`, `.card` (definidas em `globals.css`).

4. **Mudança de Tema**
   - O usuário pode alternar o tema via ThemeSwitcher.
   - O ThemeProvider atualiza as variáveis CSS, mudando instantaneamente as cores do app.

---

## Dicas e Observações
- Sempre use utilitários Tailwind baseados em variáveis (`bg-card`, `border-border`, etc) para garantir compatibilidade com todos os temas.
- Para transparência, use valores HSL com barra (ex: `'240 3.7% 15.11% / 0.5'`).
- Não use `/10` ou `/20` em cores baseadas em variável CSS, pois Tailwind só aplica opacidade corretamente em HEX/RGB.
- Para adicionar um novo tema, basta criar um novo objeto em `themes.ts` e garantir que todas as cores necessárias estejam presentes.

---

## Resumo dos Arquivos-Chave
- `tailwind.config.ts`: Mapeamento de cores do Tailwind para variáveis CSS, incluindo novas variáveis para customização (`--navbar-background`, `--hero-background`, `--features-background`).
- `src/config/themes.ts`: Definição dos temas e suas cores.
- `src/contexts/ThemeContext.tsx`: Lógica de troca e aplicação de tema, agora também buscando e aplicando overrides de customTheme do backend.
- `src/app/globals.css`: Variáveis base, utilitários e componentes customizados.

### Substituições de Tema Personalizado

O sistema agora suporta a substituição de cores de temas base (light/dark) através de um `customTheme` salvo no backend. Quando um `customTheme` é detectado, as cores definidas nele (como `navbar.background`, `hero.background`, `features.background`) sobrescrevem as cores correspondentes do tema base.

Essas cores customizadas são injetadas como variáveis CSS (ex: `--navbar-background: <valor-hsl>;`) no `<html>`, permitindo que o Tailwind CSS utilize essas variáveis para estilização. Para que as cores customizadas funcionem corretamente, é necessário:
1.  **Definir as variáveis CSS** no `ThemeContext.tsx` usando o formato HSL (ex: `10 20% 30%`).
2.  **Mapear as variáveis no `tailwind.config.ts`** para que o Tailwind as reconheça (ex: `background: 'hsl(var(--navbar-background))'`).
3.  **Usar as classes do Tailwind** nos componentes (ex: `bg-navbar-background`).

Isso permite uma personalização granular das cores de seções específicas da aplicação, mantendo a flexibilidade de alternar entre temas pré-definidos ou usar um tema totalmente customizado.

Se precisar de exemplos práticos ou quiser expandir a documentação, só avisar!
