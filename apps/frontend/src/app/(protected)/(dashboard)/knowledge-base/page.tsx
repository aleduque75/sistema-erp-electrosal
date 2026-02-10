"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import remarkEmoji from "remark-emoji";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Copy,
  Check,
  FileText,
  Edit3,
  Eye,
  Save,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";

// 1. Componente de Bloco de Código (Fora da função principal)
const CodeBlock = ({
  language,
  value,
}: {
  language: string;
  value: string;
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-border font-sans">
      <div className="flex justify-between items-center px-4 py-1.5 bg-muted text-muted-foreground text-xs font-mono">
        <span>{language || "text"}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check size={14} className="text-green-500" />
          ) : (
            <Copy size={14} />
          )}
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{ margin: 0, padding: "1rem", fontSize: "0.85rem" }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
};

// 2. Componente Principal
const KnowledgeBasePage = () => {
  // --- ESTADOS ---
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string>("");
  const [editorContent, setEditorContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false); // O que estava faltando!
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingNewFile, setIsCreatingNewFile] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>("");

  // --- EFEITOS E FUNÇÕES (Lógica do Backend) ---
  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/knowledge-base");
      setFiles(response.data);
    } catch (err) {
      setError("Erro ao carregar arquivos.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFileContent = async (filename: string) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/knowledge-base/${encodeURIComponent(filename)}`,
      );
      setSelectedFileContent(response.data);
      setEditorContent(response.data);
      setSelectedFileName(filename);
      setIsEditing(false);
    } catch (err) {
      setError(`Erro ao carregar ${filename}.`);
    } finally {
      setLoading(false);
    }
  };

  const saveFileContent = async () => {
    if (!selectedFileName) return;
    try {
      await axios.put(
        `/api/knowledge-base/${encodeURIComponent(selectedFileName)}`,
        { content: editorContent },
      );
      setSelectedFileContent(editorContent);
      setIsEditing(false);
      alert("Salvo com sucesso!");
    } catch (err) {
      alert("Erro ao salvar.");
    }
  };

  // --- RENDERIZAÇÃO ---
  if (loading && !files.length)
    return (
      <div className="p-10 flex gap-2">
        <Loader2 className="animate-spin" /> Carregando...
      </div>
    );

  return (
    <div className="flex h-screen bg-background text-foreground font-outfit">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2">
            <FileText size={18} /> Docs
          </h2>
          <button
            onClick={() => {
              setIsCreatingNewFile(true);
              setSelectedFileName(null);
            }}
            className="p-1.5 hover:bg-muted rounded-md transition"
          >
            <Plus size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {files.map((file) => (
            <button
              key={file}
              onClick={() => fetchFileContent(file)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition ${
                selectedFileName === file
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              {file}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-muted/20">
        {selectedFileName ? (
          <>
            {/* Toolbar */}
            <header className="p-4 border-b border-border bg-card flex justify-between items-center">
              <h3 className="font-semibold">{selectedFileName}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md hover:bg-muted transition text-sm"
                >
                  {isEditing ? (
                    <>
                      <Eye size={16} /> Ver
                    </>
                  ) : (
                    <>
                      <Edit3 size={16} /> Editar
                    </>
                  )}
                </button>
                {isEditing && (
                  <button
                    onClick={saveFileContent}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition text-sm"
                  >
                    <Save size={16} /> Salvar
                  </button>
                )}
              </div>
            </header>

            {/* Editor ou Visualizador */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10">
              <div className="max-w-4xl mx-auto">
                {isEditing ? (
                  <textarea
                    className="w-full h-[75vh] p-6 bg-card border border-border rounded-xl font-mono text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                  />
                ) : (
                  <article className="prose dark:prose-invert prose-blue max-w-none bg-card p-8 md:p-12 rounded-xl border border-card-border shadow-sm">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkBreaks, remarkEmoji]}
                      rehypePlugins={[rehypeRaw, rehypeSlug]}
                      components={{
                        code({ node, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          const content = String(children).replace(/\n$/, "");
                          return match ? (
                            <CodeBlock language={match[1]} value={content} />
                          ) : (
                            <code
                              className="bg-muted px-1.5 py-0.5 rounded text-primary font-semibold text-sm"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {selectedFileContent}
                    </ReactMarkdown>
                  </article>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <FileText size={48} className="mb-4 opacity-20" />
            <p>Selecione um arquivo para começar</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default KnowledgeBasePage;
