'use client';

import { Loader2 } from 'lucide-react';
import InteractiveMap from './InteractiveMap';
import { useProjects } from '@/lib/contracts/hooks/useProjects';

export default function MapPageContent() {
  const { data: projects, isLoading } = useProjects();

  if (isLoading) {
    return (
      <div className="h-screen w-full pt-16 bg-neutral-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <p className="text-neutral-400">Loading projects map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full pt-16 bg-neutral-950">
      <InteractiveMap projects={projects || []} />
    </div>
  );
}
