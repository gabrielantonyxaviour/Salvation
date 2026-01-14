'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const ProjectDetailPageContent = dynamic(
  () => import('@/components/projects/ProjectDetailPageContent'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-neutral-950">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-48 md:h-64 bg-neutral-900 rounded-lg mb-8" />
            <div className="h-8 w-48 md:w-64 bg-neutral-900 rounded mb-4" />
            <div className="h-4 w-72 md:w-96 bg-neutral-900 rounded mb-8" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-32 md:h-48 bg-neutral-900 rounded-lg" />
                <div className="h-48 md:h-64 bg-neutral-900 rounded-lg" />
              </div>
              <div className="space-y-6">
                <div className="h-72 bg-neutral-900 rounded-lg" />
                <div className="h-48 bg-neutral-900 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  }
);

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  return <ProjectDetailPageContent projectId={projectId} />;
}
