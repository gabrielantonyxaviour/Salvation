'use client';

import { Card } from '@/components/ui/card';
import { useMemo } from 'react';
import type { Project } from '@/types';

interface ProjectStatsProps {
  projects: Project[];
}

export function ProjectStats({ projects }: ProjectStatsProps) {
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const totalFunded = projects.reduce((sum, p) => sum + p.fundingRaised, 0);
    const avgAPY = projects.reduce((sum, p) => sum + p.projectedAPY, 0) / (projects.length || 1);
    const activeCount = projects.filter(p => p.status === 'active' || p.status === 'funding').length;

    return {
      totalProjects,
      totalFunded,
      avgAPY,
      activeCount,
    };
  }, [projects]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card className="p-4 bg-neutral-900/50 border-neutral-800">
        <p className="text-sm text-neutral-400">Total Projects</p>
        <p className="text-2xl font-bold text-white">{stats.totalProjects}</p>
      </Card>
      <Card className="p-4 bg-neutral-900/50 border-neutral-800">
        <p className="text-sm text-neutral-400">Total Funded</p>
        <p className="text-2xl font-bold text-green-400">
          ${(stats.totalFunded / 1000).toFixed(0)}K
        </p>
      </Card>
      <Card className="p-4 bg-neutral-900/50 border-neutral-800">
        <p className="text-sm text-neutral-400">Average APY</p>
        <p className="text-2xl font-bold text-orange-400">{stats.avgAPY.toFixed(1)}%</p>
      </Card>
      <Card className="p-4 bg-neutral-900/50 border-neutral-800">
        <p className="text-sm text-neutral-400">Active Projects</p>
        <p className="text-2xl font-bold text-white">{stats.activeCount}</p>
      </Card>
    </div>
  );
}
