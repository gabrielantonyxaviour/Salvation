'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { Project } from '@/types';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '@/types';
import { ipfsToGatewayUrl } from '@/lib/ipfs/upload';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const fundingPercentage = Math.min(
    (project.fundingRaised / project.fundingGoal) * 100,
    100
  );

  const categoryConfig = CATEGORY_CONFIG[project.category];
  const statusConfig = STATUS_CONFIG[project.status];

  const imageUrl = ipfsToGatewayUrl(project.imageUrl);

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="bg-neutral-900/50 border-neutral-800 overflow-hidden hover:border-orange-500/50 transition-all duration-300 cursor-pointer group h-full">
        {/* Project Image */}
        <div className="h-48 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-transparent z-10" />
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={project.name}
              fill
              className="object-cover z-0 group-hover:scale-110 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <span className="text-6xl z-0 group-hover:scale-110 transition-transform duration-300">
              {categoryConfig.icon}
            </span>
          )}
          {/* Status badge */}
          <span className={`absolute top-3 right-3 px-2 py-1 text-xs rounded-full ${statusConfig.color}/20 text-white border border-white/20 z-20`}>
            {statusConfig.label}
          </span>
        </div>

        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className={`px-2 py-1 text-xs rounded ${categoryConfig.color}/20 text-white`}>
              {categoryConfig.label}
            </span>
            <span className="text-sm text-neutral-400">
              {project.location.country}
            </span>
          </div>

          {/* Title and Description */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-orange-400 transition-colors">
              {project.name}
            </h3>
            <p className="text-sm text-neutral-400 line-clamp-2">
              {project.description}
            </p>
          </div>

          {/* Funding Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-400">Funding Progress</span>
              <span className="text-white font-medium">{fundingPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={fundingPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-neutral-600">
              <span>${project.fundingRaised.toLocaleString()} raised</span>
              <span>Goal: ${project.fundingGoal.toLocaleString()}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
            <div className="flex items-center gap-1">
              <span className="text-green-400 font-semibold">{project.projectedAPY}%</span>
              <span className="text-xs text-neutral-400">APY</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white font-semibold">${project.bondPrice}</span>
              <span className="text-xs text-neutral-400">per bond</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
