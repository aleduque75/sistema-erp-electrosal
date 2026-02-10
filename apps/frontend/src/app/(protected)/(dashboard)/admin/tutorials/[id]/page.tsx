'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import 'react-quill/dist/quill.snow.css';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import { toast } from 'sonner';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function TutorialEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    if (id !== 'new') {
      setIsNew(false);
      api.get(`/tutorials/${id}`)
        .then(response => {
          const data = response.data;
          setTitle(data.title);
          setSlug(data.slug);
          setContent(data.content);
        })
        .catch(error => {
          console.error('Error fetching tutorial:', error);
          toast.error('Falha ao carregar o tutorial.');
        });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tutorialData = { title, slug, content };

    const request = isNew
      ? api.post('/tutorials', tutorialData)
      : api.patch(`/tutorials/${id}`, tutorialData);

    try {
      await request;
      toast.success(`Tutorial ${isNew ? 'criado' : 'atualizado'} com sucesso!`);
      router.push('/admin/tutorials');
    } catch (error) {
      console.error('Error saving tutorial:', error);
      toast.error('Falha ao salvar o tutorial.');
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (isNew) {
      setSlug(newTitle.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{isNew ? 'Criar Novo Tutorial' : 'Editar Tutorial'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={title}
                onChange={handleTitleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                disabled={!isNew}
              />
            </div>
            <div>
              <Label>Conteúdo</Label>
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={{
                  toolbar: [
                    [{ 'header': '1'}, {'header': '2'}],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{'list': 'ordered'}, {'list': 'bullet'}],
                    ['link', 'image'],
                    ['clean']
                  ],
                }}
              />
            </div>
            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => router.push('/admin/tutorials')}>
                    Cancelar
                </Button>
                <Button type="submit">
                    Salvar
                </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
