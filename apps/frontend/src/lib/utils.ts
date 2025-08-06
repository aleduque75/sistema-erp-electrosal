import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeImagePath(path: string): string {
  // Remove barras iniciais e finais, e qualquer ocorrência de '/uploads/'
  let normalizedPath = path.replace(/^\/+|\/+$/g, '').replace(/uploads\//g, '');
  // Garante que comece com '/uploads/'
  return `/uploads/${normalizedPath}`;
}
