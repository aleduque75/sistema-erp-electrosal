"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { CodeBlock } from "@/components/CodeBlock"; // Assumindo que CodeBlock está em src/components/

// Define as chaves de artigo para segurança de tipo
type ArticleKey = "git-basics" | "git-branching";

// Define o objeto de artigos com os caminhos públicos corretos
const articles: Record<ArticleKey, { title: string; contentPath: string }> = {
  "git-basics": {
    title: "Conceitos Básicos do Git",
    contentPath: "/articles/git-basics.md",
  },
  "git-branching": {
    title: "Guia Rápido de Branches",
    contentPath: "/articles/git-branching.md",
  },
};

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  node?: any; // Adicionado para compatibilidade com ReactMarkdown
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const HelpCenterPage: React.FC = () => {
  const [currentArticleId, setCurrentArticleId] =
    useState<ArticleKey>("git-branching");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);

  const currentArticle = articles[currentArticleId];

  useEffect(() => {
    if (currentArticle) {
      setLoading(true);
      fetch(currentArticle.contentPath)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.text();
        })
        .then((text) => {
          setMarkdown(text);
        })
        .catch((err) => {
          console.error("Falha ao carregar o artigo:", err);
          setMarkdown(
            `## Erro ao carregar artigo\n\nNão foi possível encontrar o arquivo em \`${currentArticle.contentPath}\`. Verifique se o arquivo existe na pasta \`public/articles/\`.`
          );
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [currentArticle]);

  return (
    <article className="prose lg:prose-xl max-w-none">
      <h1 className="mb-4">{currentArticle.title}</h1>

      {/* Seletor de Artigos (opcional, mas útil) */}
      <div className="mb-8">
        <select
          value={currentArticleId}
          onChange={(e) => setCurrentArticleId(e.target.value as ArticleKey)}
          className="border p-2 rounded"
        >
          <option value="git-branching">Guia de Branches</option>
          <option value="git-basics">Básico do Git</option>
        </select>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <ReactMarkdown
          children={markdown}
          components={{
            code({ node, inline, className, children, ...props }: CodeProps) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <CodeBlock language={match[1]}>
                  {String(children).replace(/\n$/, "")}
                </CodeBlock>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        />
      )}
    </article>
  );
};
