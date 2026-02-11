'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Tutorial } from '@prisma/client';
import { API_BASE_URL } from '@/lib/api';

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);

  useEffect(() => {
    async function fetchTutorials() {
      try {
        const response = await fetch(`${API_BASE_URL}/tutorials`);
        if (response.ok) {
          const data = await response.json();
          setTutorials(data);
        } else {
          console.error('Failed to fetch tutorials');
        }
      } catch (error) {
        console.error('Error fetching tutorials:', error);
      }
    }
    fetchTutorials();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este tutorial?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/tutorials/${id}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setTutorials(tutorials.filter((t) => t.id !== id));
        } else {
          console.error('Failed to delete tutorial');
        }
      } catch (error) {
        console.error('Error deleting tutorial:', error);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tutoriais</CardTitle>
          <Link href="/admin/tutorials/new">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Criar Tutorial
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tutorials.map((tutorial) => (
                <TableRow key={tutorial.id}>
                  <TableCell>{tutorial.title}</TableCell>
                  <TableCell>{tutorial.slug}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/admin/tutorials/${tutorial.id}`}>
                        <Button variant="outline" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(tutorial.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
