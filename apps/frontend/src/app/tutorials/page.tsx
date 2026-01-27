'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Tutorial } from '@prisma/client';
import { API_BASE_URL } from '@/lib/api';

export default function TutorialsListPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTutorials() {
      try {
        const response = await fetch(`${API_BASE_URL}/tutorials`);
        if (response.ok) {
          const data = await response.json();
          setTutorials(data);
        } else {
          setError('Falha ao buscar os tutoriais.');
        }
      } catch (err) {
        setError('Ocorreu um erro ao buscar os tutoriais.');
      } finally {
        setLoading(false);
      }
    }
    fetchTutorials();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-4">Carregando...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Tutoriais de Ajuda</CardTitle>
        </CardHeader>
        <CardContent>
          {tutorials.length > 0 ? (
            <ul className="space-y-2">
              {tutorials.map((tutorial) => (
                <li key={tutorial.id}>
                  <Link
                    href={`/tutorials/${tutorial.slug}`}
                    className="text-lg text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {tutorial.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum tutorial encontrado.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
