'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export interface SearchResult {
  tipo: 'publicacao' | 'processo' | 'cliente' | 'tarefa';
  id: string;
  titulo: string;
  subtitulo: string;
  href: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useGlobalSearch(query: string, limit = 5) {
  const debounced = useDebounce(query.trim(), 300);

  return useQuery<SearchResult[]>({
    queryKey: ['global-search', debounced, limit],
    enabled: debounced.length >= 2,
    staleTime: 15_000,
    queryFn: async () => {
      const { data, error } = await createClient().rpc('global_search', {
        p_query: debounced,
        p_limit: limit,
      });
      if (error) throw error;
      return (data ?? []) as SearchResult[];
    },
  });
}

export { useDebounce };
export type { };
