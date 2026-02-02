# Guia do Sistema de Estilos e Temas (Frontend)

Este documento explica como o sistema de estilos e temas funciona no projeto frontend, baseado em **Tailwind CSS** e **shadcn/ui**.

---

## 1. Visão Geral

O sistema de temas permite que a aparência da aplicação (cores, bordas, etc.) seja alterada dinamicamente pelo usuário. A base tecnológica é:

- **Tailwind CSS:** Um framework CSS "utility-first" que usamos para construir os componentes. As classes de utilidade (como `bg-background`, `text-primary`) são a base de todo o estilo.
- **shadcn/ui:** Não é uma biblioteca de componentes, mas um conjunto de scripts que adiciona componentes estilizados e acessíveis ao nosso projeto. Ele se integra perfeitamente com o Tailwind CSS.
- **CSS Variables (Variáveis CSS):** O segredo para a troca de temas. Toda a paleta de cores é definida usando variáveis CSS, e os temas simplesmente trocam os valores dessas variáveis.

---

## 2. Arquivos de Configuração Principais

### a. `tailwind.config.ts`

Este é o coração da configuração do Tailwind CSS. Ele define os "design tokens" da nossa aplicação.

- **`theme.extend.colors`**: Aqui mapeamos nomes de cores (ex: `primary`, `background`, `card`) para variáveis CSS no formato `hsl(var(--nome-da-variavel))`.
  - **Exemplo:** `background: 'hsl(var(--background))'`
- **`theme.extend.borderRadius`**: Define os valores de arredondamento de bordas, também usando uma variável CSS (`var(--radius)`).

**Importante:** Nós não colocamos valores de cores diretamente aqui. Apenas apontamos para as variáveis que serão definidas pelos temas.

### b. `src/config/themes.ts`

Este arquivo define todos os temas disponíveis na aplicação.

- É um objeto chamado `themes`, onde cada chave é o nome de um tema (ex: `light`, `dark`, `fuchsia-dark`).
- Cada objeto de tema contém:
  - `name`: Um nome amigável para exibição na interface (ex: "Escuro (Padrão)").
  - `colors`: Um objeto que mapeia cada variável CSS de cor para seu valor HSL (Hue, Saturation, Lightness).
    - **Exemplo (no tema `light`):** `'background': '0 0% 100%'`
    - **Exemplo (no tema `dark`):** `'background': '240 10% 3.9%'`

Quando um usuário seleciona um tema, o `ThemeProvider` (em `src/components/theme-provider.tsx`) aplica as cores do tema escolhido às variáveis CSS na raiz do documento (`:root`), e o Tailwind CSS, que já usa essas variáveis, atualiza a UI instantaneamente.

---

## 3. Como Funciona na Prática

1.  **Componente:** Um botão no nosso código usa a classe `bg-primary`.
2.  **Tailwind Config:** `tailwind.config.ts` diz que a cor `primary` é `hsl(var(--primary))`.
3.  **Themes Config:** O tema `light` em `themes.ts` define que a variável `--primary` tem o valor `240 5.9% 10%` (preto).
4.  **Renderização (Tema Claro):** O navegador renderiza o botão com a cor de fundo preta.
5.  **Troca de Tema:** O usuário seleciona o tema `fuchsia-dark`.
6.  **Themes Config:** O tema `fuchsia-dark` define que a variável `--primary` tem o valor `330 80% 60%` (um tom de fúcsia).
7.  **Renderização (Tema Escuro):** O `ThemeProvider` atualiza o valor da variável `--primary` no CSS. O navegador re-renderiza o botão, que agora tem um fundo fúcsia, sem precisar recarregar a página.

---

## 4. Como Adicionar um Novo Tema

1.  Abra o arquivo `apps/frontend/src/config/themes.ts`.
2.  Adicione uma nova entrada ao objeto `themes`. Use um dos temas existentes como modelo.
3.  Dê um nome único à chave (ex: `'ocean-blue-dark'`).
4.  Defina o `name` (nome de exibição).
5.  Preencha todos os valores de `colors` com os HSL desejados para o seu novo tema.
6.  Salve o arquivo. O novo tema aparecerá automaticamente no seletor de temas da aplicação.