---
description: Padrões de Otimização Mobile (S23) e Correções de Mídia/PDF do ERP Electrosal
---

# 📱 Otimização Mobile (S23) & Mídia

Este guia serve como referência para manter os padrões de UI/UX e funcionalidade estabelecidos durante a otimização de Fevereiro/2026.

## 1. Padrão de Modais (Visualização e Edição)
Para garantir que o sistema seja "premium" e funcional no Samsung S23 e outros smartphones:

- **Componente**: Usar a lógica condicional de `isDesktop` (breakpoint de 768px).
- **Desktop**: Utilizar `Dialog` (Shadcn/UI) com cabeçalho fixo e sombreado.
- **Mobile**: Utilizar `Drawer` (Vaul) que desliza da parte inferior e ocupa a tela inteira ou 90% dela.
- **Sizing**: 
  - Visualização: `sm:max-w-4xl`.
  - Formulários/Lançamentos: `sm:max-w-2xl`.

## 2. Galeria de Mídias e Imagens
Para evitar erros de "Imagem não encontrada" (404):

- **Backend**: O serviço de mídia deve sempre retornar uma propriedade `url` contendo o caminho absoluto e autenticado (ex: `https://dev-api.electrosal.com.br/api/media/public-media/[id]`).
- **Frontend**: Priorizar o uso de `item.url`. Usar `item.path` apenas como fallback.
- **Componente**: Usar `ImageGallery.tsx` para garantir que o comportamento de zoom e exclusão seja consistente em todo o sistema.

## 3. Gestão de PDFs
Funcionalidade crítica para as Análises Químicas:

- **Download**: Deve ser feito via `api.get` com `responseType: 'blob'`.
- **Botão**: 
  - **Desktop**: Ícone de impressora no cabeçalho do `DialogTitle`.
  - **Mobile**: Botão de largura total no `DrawerFooter`.
- **Nome do Arquivo**: Seguir o padrão `analise_[numero].pdf`.

## 4. Tabelas Mobile-First
- Sempre implementar **Seleção em Lote** (checkbox na primeira coluna).
- Usar ícones grandes no `DropdownMenu` para facilitar o clique com o polegar.
- Itens de status devem usar o componente `Badge` correspondente para feedback visual imediato.

---
*Este workflow deve ser consultado antes de criar qualquer nova tela de visualização ou edição no ERP.*
