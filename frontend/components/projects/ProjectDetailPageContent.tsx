'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MilestoneTimeline, BondPurchase } from '@/components/projects';
import { useProject } from '@/lib/contracts/hooks/useProjects';
import { useMarketsByProject } from '@/lib/contracts/hooks/useMarkets';
import { CATEGORY_CONFIG, STATUS_CONFIG } from '@/types';
import { ipfsToGatewayUrl } from '@/lib/ipfs/upload';
import { ArrowLeft, MapPin, Users, ExternalLink, TrendingUp } from 'lucide-react';
import Image from 'next/image';

interface ProjectDetailPageContentProps {
  projectId: string;
}

export default function ProjectDetailPageContent({ projectId }: ProjectDetailPageContentProps) {
  const router = useRouter();

  const { data: project, isLoading, error } = useProject(projectId);
  const { data: markets = [] } = useMarketsByProject(projectId);

  if (isLoading) {
    return (
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
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error loading project</p>
          <p className="text-neutral-500 text-sm mb-4">{error.message}</p>
          <Link href="/projects">
            <Button variant="outline" className="border-neutral-700 text-white hover:bg-neutral-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-bold text-white mb-4">Project Not Found</h1>
          <Link href="/projects">
            <Button variant="outline" className="border-neutral-700 text-white hover:bg-neutral-800">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const fundingPercentage = Math.min(
    (project.fundingRaised / project.fundingGoal) * 100,
    100
  );
  const categoryConfig = CATEGORY_CONFIG[project.category];
  const statusConfig = STATUS_CONFIG[project.status];
  const imageUrl = ipfsToGatewayUrl(project.imageUrl);

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Hero Section */}
      <div className="h-48 md:h-64 bg-gradient-to-br from-neutral-900 to-neutral-950 relative overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={project.name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl md:text-8xl opacity-20">{categoryConfig.icon}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent" />
      </div>

      <div className="container mx-auto px-4 -mt-12 md:-mt-16 relative z-10 pb-12">
        {/* Back Link */}
        <Link
          href="/projects"
          className="inline-flex items-center text-neutral-400 hover:text-white mb-4 md:mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Projects
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge className={`${categoryConfig.color}/20 text-white border-0`}>
              {categoryConfig.icon} {categoryConfig.label}
            </Badge>
            <Badge className={`${statusConfig.color}/20 text-white border-0`}>
              {statusConfig.label}
            </Badge>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">{project.name}</h1>
          <div className="flex items-center gap-2 text-neutral-400">
            <MapPin className="h-4 w-4" />
            <span>{project.location.region}, {project.location.country}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Project Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <Card className="p-3 md:p-4 bg-neutral-900/50 border-neutral-800 text-center">
                <p className="text-xl md:text-2xl font-bold text-orange-400">{fundingPercentage.toFixed(0)}%</p>
                <p className="text-xs text-neutral-400">Funded</p>
              </Card>
              <Card className="p-3 md:p-4 bg-neutral-900/50 border-neutral-800 text-center">
                <p className="text-xl md:text-2xl font-bold text-orange-400">{project.projectedAPY}%</p>
                <p className="text-xs text-neutral-400">APY</p>
              </Card>
              <Card className="p-3 md:p-4 bg-neutral-900/50 border-neutral-800 text-center">
                <p className="text-xl md:text-2xl font-bold text-white">
                  ${project.fundingRaised.toLocaleString()}
                </p>
                <p className="text-xs text-neutral-400">Raised</p>
              </Card>
              <Card className="p-3 md:p-4 bg-neutral-900/50 border-neutral-800 text-center">
                <p className="text-xl md:text-2xl font-bold text-white">
                  ${project.fundingGoal.toLocaleString()}
                </p>
                <p className="text-xs text-neutral-400">Goal</p>
              </Card>
            </div>

            {/* Funding Progress */}
            <Card className="p-4 md:p-6 bg-neutral-900/50 border-neutral-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-white">Funding Progress</h2>
                <span className="text-white font-semibold">{fundingPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={fundingPercentage} className="h-3 mb-2" />
              <div className="flex justify-between text-xs md:text-sm text-neutral-400">
                <span>${project.fundingRaised.toLocaleString()} raised</span>
                <span>${(project.fundingGoal - project.fundingRaised).toLocaleString()} remaining</span>
              </div>
            </Card>

            {/* Description */}
            <Card className="p-4 md:p-6 bg-neutral-900/50 border-neutral-800">
              <h2 className="text-lg md:text-xl font-semibold text-white mb-4">About This Project</h2>
              <p className="text-sm md:text-base text-neutral-300 mb-6">{project.description}</p>

              <h3 className="text-base md:text-lg font-semibold text-white mb-2">Revenue Model</h3>
              <p className="text-sm md:text-base text-neutral-300">{project.revenueModel}</p>
            </Card>

            {/* Milestones */}
            <MilestoneTimeline milestones={project.milestones || []} />

            {/* Sponsor Info */}
            <Card className="p-4 md:p-6 bg-neutral-900/50 border-neutral-800">
              <h2 className="text-lg md:text-xl font-semibold text-white mb-4">Project Sponsor</h2>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">
                    {project.sponsor.slice(0, 6)}...{project.sponsor.slice(-4)}
                  </p>
                  <a
                    href={`https://sepolia.mantlescan.xyz/address/${project.sponsor}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1"
                  >
                    View on Explorer
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Bond Purchase */}
            <BondPurchase project={project} />

            {/* Markets Preview */}
            <Card className="p-4 md:p-6 bg-neutral-900/50 border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                  <h2 className="text-lg md:text-xl font-semibold text-white">Prediction Markets</h2>
                </div>
                {markets.length > 0 && (
                  <Badge variant="secondary" className="bg-neutral-800 text-neutral-300">
                    {markets.length}
                  </Badge>
                )}
              </div>

              {markets.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-neutral-400 text-sm">No markets created yet</p>
                </div>
              ) : (
                <>
                  <ScrollArea className={markets.length > 2 ? 'h-[280px]' : ''}>
                    <div className="space-y-4 pr-2">
                      {markets.map((market) => (
                        <div
                          key={market.id}
                          className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700 hover:border-neutral-600 transition-colors cursor-pointer"
                          onClick={() => router.push(`/markets/${market.address}`)}
                        >
                          <p className="text-sm text-white font-medium mb-3 line-clamp-2">
                            {market.question}
                          </p>
                          <div className="space-y-2 mb-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-green-400">YES ${market.yesPrice.toFixed(2)}</span>
                              <span className="text-red-400">NO ${market.noPrice.toFixed(2)}</span>
                            </div>
                            <div className="w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-green-500 to-green-400 h-2"
                                style={{ width: `${market.yesPrice * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-neutral-400">
                            <span>Vol: ${market.totalVolume.toLocaleString()}</span>
                            <span className={market.resolved ? 'text-neutral-500' : 'text-orange-400'}>
                              {market.resolved ? 'Resolved' : 'Active'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Button
                    variant="outline"
                    className="w-full mt-4 border-neutral-700 text-white hover:bg-neutral-800"
                    onClick={() => router.push(`/markets?project=${projectId}`)}
                  >
                    View All Markets
                  </Button>
                </>
              )}
            </Card>

            {/* Quick Stats */}
            <Card className="p-4 md:p-6 bg-neutral-900/50 border-neutral-800">
              <h2 className="text-base md:text-lg font-semibold text-white mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Bond Price</span>
                  <span className="text-white">${project.bondPrice}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Total Bonds</span>
                  <span className="text-white">
                    {(project.fundingGoal / project.bondPrice).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Bonds Sold</span>
                  <span className="text-white">
                    {(project.fundingRaised / project.bondPrice).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">Created</span>
                  <span className="text-white">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
