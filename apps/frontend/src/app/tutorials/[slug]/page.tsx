'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tutorial } from '@prisma/client';
import { API_BASE_URL } from '@/lib/api';

export default function PublicTutorialPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [tutorial, setTutorial] = useState<Tutorial | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (slug) {
            async function fetchTutorial() {
                try {
                    const response = await fetch(`${API_BASE_URL}/tutorials/slug/${slug}`);
                    if (response.ok) {
                        const data = await response.json();
                        setTutorial(data);
                    } else {
                        setError('Tutorial não encontrado.');
                    }
                } catch (err) {
                    setError('Ocorreu um erro ao buscar o tutorial.');
                } finally {
                    setLoading(false);
                }
            }
            fetchTutorial();
        }
    }, [slug]);

    if (loading) {
        return <div className="container mx-auto p-4">Carregando...</div>;
    }

    if (error) {
        return <div className="container mx-auto p-4">{error}</div>;
    }

    if (!tutorial) {
        return <div className="container mx-auto p-4">Tutorial não encontrado.</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>{tutorial.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: tutorial.content }}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

