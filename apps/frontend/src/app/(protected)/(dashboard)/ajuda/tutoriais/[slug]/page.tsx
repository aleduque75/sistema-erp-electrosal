"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import ReactMarkdown from "react-markdown";

// Interface local para o tipo Tutorial
interface Tutorial {
  id: string;
  title: string;
  slug: string;
  content: string;
}

export default function TutorialPage() {
  const params = useParams();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Garante que 'params' não é nulo antes de acessar 'slug'
    if (params?.slug) {
      const slug = params.slug as string;
      // Converte a declaração de função para uma expressão de função
      const fetchTutorial = async () => {
        try {
          const response = await api.get(`/tutorials/slug/${slug}`);
          setTutorial(response.data);
        } catch (error) {
          console.error("Failed to fetch tutorial:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchTutorial();
    } else {
      // Se não houver slug, para de carregar
      setLoading(false);
    }
  }, [params]);

  if (isLoading) {
    return <p>Carregando tutorial...</p>;
  }

  if (!tutorial) {
    return <p>Tutorial não encontrado.</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <Button asChild variant="outline" className="mb-4">
        <Link href="/ajuda/tutoriais">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a lista
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{tutorial.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none dark:prose-invert">
            <ReactMarkdown>{tutorial.content}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
