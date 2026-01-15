'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, TrendingUp, Shield, Globe, Droplets, Sun, GraduationCap, Heart, Leaf, Loader2 } from 'lucide-react';
import { useProjects } from '@/lib/contracts/hooks/useProjects';
import { useMarkets } from '@/lib/contracts/hooks/useMarkets';
import { CATEGORY_CONFIG, STATUS_CONFIG, type ProjectCategory } from '@/types';
import { ipfsToGatewayUrl } from '@/lib/ipfs/upload';

// Dynamic import to avoid SSR issues with mapbox-gl
const HeatMapWidget = dynamic(
  () => import('@/components/map/HeatMapWidget'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[500px] md:h-[600px] bg-neutral-900 rounded-2xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }
);

const categoryIcons: Record<ProjectCategory, React.ComponentType<{ className?: string }>> = {
  water: Droplets,
  solar: Sun,
  education: GraduationCap,
  healthcare: Heart,
  agriculture: Leaf,
};

export default function HomePageContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: markets, isLoading: marketsLoading } = useMarkets();

  const isLoading = projectsLoading || marketsLoading;

  // Calculate stats from real data
  const stats = useMemo(() => {
    if (!projects || !markets) {
      return {
        projectsFunded: 0,
        totalValueLocked: 0,
        averageAPY: 0,
        investors: 0,
        activeMarkets: 0,
        marketsVolume: 0,
      };
    }

    const fundedProjects = projects.filter(p => p.status === 'active' || p.status === 'completed');
    const totalRaised = projects.reduce((sum, p) => sum + p.fundingRaised, 0);
    const avgAPY = projects.length > 0
      ? projects.reduce((sum, p) => sum + p.projectedAPY, 0) / projects.length
      : 0;
    const activeMarkets = markets.filter(m => !m.resolved).length;
    const totalVolume = markets.reduce((sum, m) => sum + m.totalVolume, 0);

    return {
      projectsFunded: fundedProjects.length,
      totalValueLocked: totalRaised,
      averageAPY: Math.round(avgAPY * 10) / 10,
      investors: 142, // Would need to calculate from bond holders
      activeMarkets,
      marketsVolume: totalVolume,
    };
  }, [projects, markets]);

  const displayStats = [
    { label: 'Projects Funded', value: stats.projectsFunded.toString() },
    { label: 'Total Value Locked', value: `$${(stats.totalValueLocked / 1000).toFixed(0)}K` },
    { label: 'Average APY', value: `${stats.averageAPY}%` },
    { label: 'Active Investors', value: stats.investors.toString() },
  ];

  const steps = [
    {
      icon: Globe,
      title: 'Browse Projects',
      description: 'Explore verified infrastructure projects across Africa - water, solar, education, and more.',
    },
    {
      icon: TrendingUp,
      title: 'Invest & Earn',
      description: 'Purchase yield-bearing bonds and earn real returns from operational infrastructure.',
    },
    {
      icon: Shield,
      title: 'Track & Verify',
      description: 'Monitor progress with prediction markets and multi-source oracle verification.',
    },
  ];

  const featuredProjects = projects?.slice(0, 3) || [];

  const getCategoryColor = (category: ProjectCategory) => {
    const colors: Record<ProjectCategory, string> = {
      water: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      solar: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      education: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      healthcare: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      agriculture: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return colors[category] || 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      funding: 'bg-orange-500/20 text-orange-400',
      active: 'bg-green-500/20 text-green-400',
      completed: 'bg-blue-500/20 text-blue-400',
      failed: 'bg-red-500/20 text-red-400',
      pending: 'bg-neutral-500/20 text-neutral-400',
    };
    return colors[status] || 'bg-neutral-500/20 text-neutral-400';
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            <Badge className="mb-6 bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30">
              Built on Mantle Network
            </Badge>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Yield-Generating African
              <span className="text-orange-500 block"> Infrastructure Bonds</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-300 max-w-2xl lg:max-w-none mb-10">
              Invest in verified infrastructure projects. Earn real yield from operations.
              Track outcomes with integrated prediction markets and oracle verification.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/projects">
                <Button size="lg" className="w-full sm:w-auto px-8">
                  Browse Projects
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/markets">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-neutral-700 text-white hover:bg-neutral-900 px-8">
                  View Markets
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-green-500/20 blur-3xl rounded-full" />
              <Image
                src="/images/hero/hero.png"
                alt="African Infrastructure Investment"
                width={600}
                height={600}
                className="relative z-10 w-full h-auto object-contain rounded-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {displayStats.map((stat) => (
            <Card key={stat.label} className="p-4 md:p-6 bg-neutral-900/50 border-neutral-800 text-center hover:border-orange-500/30 transition-colors">
              <p className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">{stat.value}</p>
              <p className="text-xs md:text-sm text-neutral-400">{stat.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">How It Works</h2>
        <p className="text-neutral-400 text-center mb-12 max-w-xl mx-auto">
          Transform infrastructure funding from charity into investment with transparent, yield-generating, accountable financing.
        </p>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, index) => (
            <Card key={step.title} className="p-6 md:p-8 bg-neutral-900/50 border-neutral-800 text-center hover:border-orange-500/30 transition-colors">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <step.icon className="h-7 w-7 md:h-8 md:w-8 text-orange-500" />
              </div>
              <div className="text-sm text-orange-500 font-medium mb-2">Step {index + 1}</div>
              <h3 className="text-lg md:text-xl font-semibold text-white mb-2">{step.title}</h3>
              <p className="text-sm md:text-base text-neutral-400">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Interactive Globe Map */}
      {projects && projects.length > 0 && (
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Impact Across Africa</h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Explore our growing network of infrastructure projects transforming communities across the continent.
            </p>
          </div>
          <HeatMapWidget projects={projects} />
        </section>
      )}

      {/* Featured Projects */}
      <section className="container mx-auto px-4 py-16">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white">Featured Projects</h2>
            <p className="text-neutral-400 mt-1">Discover high-impact infrastructure investments</p>
          </div>
          <Link href="/projects">
            <Button variant="ghost" className="text-orange-500 hover:text-orange-400 hover:bg-orange-500/10">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProjects.map((project) => {
              const fundingPercent = Math.round((project.fundingRaised / project.fundingGoal) * 100);
              const CategoryIcon = categoryIcons[project.category];
              const imageUrl = ipfsToGatewayUrl(project.imageUrl);

              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="bg-neutral-900/50 border-neutral-800 overflow-hidden hover:border-orange-500/50 transition-all duration-200 cursor-pointer group h-full">
                    <div className="h-40 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent group-hover:from-orange-500/20 transition-colors z-10" />
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={project.name}
                          fill
                          className="object-cover z-0 group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      ) : (
                        <CategoryIcon className="h-16 w-16 text-neutral-600 group-hover:text-neutral-500 transition-colors" />
                      )}
                      <Badge className={`absolute top-3 right-3 z-20 ${getStatusColor(project.status)}`}>
                        {STATUS_CONFIG[project.status]?.label || project.status}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={getCategoryColor(project.category)}>
                          {CATEGORY_CONFIG[project.category]?.label || project.category}
                        </Badge>
                        <span className="text-sm text-neutral-400">{project.location.country}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-orange-400 transition-colors">
                        {project.name}
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-neutral-400">Funding Progress</span>
                            <span className="text-white font-medium">{fundingPercent}%</span>
                          </div>
                          <Progress value={fundingPercent} className="h-2" />
                          <div className="flex justify-between text-xs text-neutral-500 mt-1">
                            <span>${project.fundingRaised.toLocaleString()}</span>
                            <span>${project.fundingGoal.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-neutral-800">
                          <span className="text-green-400 font-medium">{project.projectedAPY}% APY</span>
                          <span className="text-neutral-400">{project.location.region}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Prediction Markets Teaser */}
      <section className="container mx-auto px-4 py-16">
        <Card className="p-6 md:p-10 bg-gradient-to-br from-neutral-900/80 to-neutral-950/80 border-neutral-800">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">
                Prediction Markets
              </Badge>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Trade on Project Outcomes
              </h2>
              <p className="text-neutral-300 mb-6">
                Every project has an integrated prediction market. Trade YES/NO tokens based on your conviction about project success. Hedge your bond positions or speculate on outcomes.
              </p>
              <Link href="/markets">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25">
                  Explore Markets
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-neutral-900/50 border-neutral-800">
                <p className="text-2xl font-bold text-white">{stats.activeMarkets}</p>
                <p className="text-sm text-neutral-400">Active Markets</p>
              </Card>
              <Card className="p-4 bg-neutral-900/50 border-neutral-800">
                <p className="text-2xl font-bold text-white">${(stats.marketsVolume / 1000).toFixed(1)}K</p>
                <p className="text-sm text-neutral-400">Total Volume</p>
              </Card>
              <Card className="p-4 bg-neutral-900/50 border-neutral-800 col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-400">Sample Market</p>
                    <p className="text-white font-medium">
                      {featuredProjects[0]?.name || 'Loading...'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold">
                      {markets?.[0]?.yesPrice ? `${Math.round(markets[0].yesPrice * 100)}% YES` : '-- YES'}
                    </p>
                    <p className="text-xs text-neutral-400">Market Confidence</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 md:py-20 text-center">
        <Card className="p-8 md:p-12 bg-gradient-to-r from-orange-500/20 via-orange-500/10 to-neutral-900/50 border-orange-500/30">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to Make an Impact?
          </h2>
          <p className="text-neutral-300 mb-8 max-w-xl mx-auto">
            Join investors earning real yield while funding critical infrastructure across Africa.
            Every investment creates measurable, verifiable impact.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/projects">
              <Button size="lg" className="w-full sm:w-auto px-8">
                Browse All Projects
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/sponsor">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-neutral-700 text-white hover:bg-neutral-900 px-8">
                Submit a Project
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
