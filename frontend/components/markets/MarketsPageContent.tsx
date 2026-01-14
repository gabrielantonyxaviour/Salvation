'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MarketList } from '@/components/markets';
import { MarketGrid } from './MarketGrid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarkets } from '@/lib/contracts/hooks/useMarkets';
import { useProjects } from '@/lib/contracts/hooks/useProjects';
import { Loader2, Search, LayoutList, LayoutGrid, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MarketStatus } from '@/types/market';

type ViewMode = 'list' | 'grid';

export default function MarketsPageContent() {
  const searchParams = useSearchParams();
  const initialProjectFilter = searchParams.get('project') || 'all';

  const [statusFilter, setStatusFilter] = useState<MarketStatus>('active');
  const [projectFilter, setProjectFilter] = useState<string>(initialProjectFilter);
  const [projectFilterOpen, setProjectFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const { data: markets, isLoading, error } = useMarkets();
  const { data: projects } = useProjects();

  // Update filter when URL param changes
  useEffect(() => {
    const projectParam = searchParams.get('project');
    if (projectParam) {
      setProjectFilter(projectParam);
    }
  }, [searchParams]);

  // Get unique projects from markets for filter options
  const projectOptions = useMemo(() => {
    if (!markets) return [];
    const uniqueProjects = new Map<string, string>();
    markets.forEach(m => {
      if (m.projectId && m.projectName) {
        uniqueProjects.set(m.projectId, m.projectName);
      }
    });
    return Array.from(uniqueProjects.entries()).map(([id, name]) => ({ id, name }));
  }, [markets]);

  // Filter markets based on all criteria
  const filteredMarkets = useMemo(() => {
    if (!markets) return [];

    return markets.filter(market => {
      // Status filter
      if (statusFilter === 'active' && market.resolved) return false;
      if (statusFilter === 'resolved' && !market.resolved) return false;

      // Project filter
      if (projectFilter !== 'all' && market.projectId !== projectFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesQuestion = market.question.toLowerCase().includes(query);
        const matchesProject = market.projectName.toLowerCase().includes(query);
        if (!matchesQuestion && !matchesProject) return false;
      }

      return true;
    });
  }, [markets, statusFilter, projectFilter, searchQuery]);

  // Calculate stats
  const activeCount = markets?.filter(m => !m.resolved).length || 0;
  const resolvedCount = markets?.filter(m => m.resolved).length || 0;
  const totalVolume = markets?.reduce((sum, m) => sum + m.totalVolume, 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-neutral-400">Loading markets...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error loading markets</p>
          <p className="text-neutral-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Prediction Markets</h1>
          <p className="text-neutral-400">
            Trade on project outcomes. Buy YES if you believe a project will succeed, NO if you think it will fail.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 bg-neutral-900/50 border-neutral-800">
            <p className="text-sm text-neutral-400">Active Markets</p>
            <p className="text-2xl font-bold text-white">{activeCount}</p>
          </Card>
          <Card className="p-4 bg-neutral-900/50 border-neutral-800">
            <p className="text-sm text-neutral-400">Total Volume</p>
            <p className="text-2xl font-bold text-white">
              ${totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}K` : totalVolume.toLocaleString()}
            </p>
          </Card>
          <Card className="p-4 bg-neutral-900/50 border-neutral-800">
            <p className="text-sm text-neutral-400">Resolved</p>
            <p className="text-2xl font-bold text-white">{resolvedCount}</p>
          </Card>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search Bar - Flexes to fill space */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-neutral-900 border-neutral-800 text-white placeholder:text-neutral-500 focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
            />
          </div>

          {/* Right-aligned controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Project Filter - Searchable Combobox */}
            <Popover open={projectFilterOpen} onOpenChange={setProjectFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={projectFilterOpen}
                  className="w-[200px] justify-between bg-neutral-900 border-neutral-800 text-white hover:bg-neutral-800 hover:text-white"
                >
                  {projectFilter === 'all'
                    ? 'All Projects'
                    : projectOptions.find(p => p.id === projectFilter)?.name || 'All Projects'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0 bg-neutral-900 border-neutral-800">
                <Command className="bg-neutral-900">
                  <CommandInput
                    placeholder="Search projects..."
                    className="text-white"
                  />
                  <CommandList>
                    <CommandEmpty className="text-neutral-400 text-sm py-6 text-center">
                      No project found.
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="all"
                        onSelect={() => {
                          setProjectFilter('all');
                          setProjectFilterOpen(false);
                        }}
                        className="text-white hover:bg-neutral-800 cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            projectFilter === 'all' ? "opacity-100" : "opacity-0"
                          )}
                        />
                        All Projects
                      </CommandItem>
                      {projectOptions.map(project => (
                        <CommandItem
                          key={project.id}
                          value={project.name}
                          onSelect={() => {
                            setProjectFilter(project.id);
                            setProjectFilterOpen(false);
                          }}
                          className="text-white hover:bg-neutral-800 cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              projectFilter === project.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {project.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value: MarketStatus) => setStatusFilter(value)}>
              <SelectTrigger className="w-[140px] bg-neutral-900 border-neutral-800 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-neutral-900 border-neutral-800">
                <SelectItem value="active" className="text-white hover:bg-neutral-800">Active</SelectItem>
                <SelectItem value="resolved" className="text-white hover:bg-neutral-800">Resolved</SelectItem>
                <SelectItem value="all" className="text-white hover:bg-neutral-800">All</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="bg-neutral-800 border border-neutral-700">
                <TabsTrigger
                  value="list"
                  className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white text-neutral-400 px-3"
                >
                  <LayoutList className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger
                  value="grid"
                  className="data-[state=active]:bg-neutral-700 data-[state=active]:text-white text-neutral-400 px-3"
                >
                  <LayoutGrid className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Results count */}
        {searchQuery || projectFilter !== 'all' ? (
          <p className="text-sm text-neutral-400 mb-4">
            {filteredMarkets.length} market{filteredMarkets.length !== 1 ? 's' : ''} found
          </p>
        ) : null}

        {/* Markets List/Grid */}
        {viewMode === 'list' ? (
          <MarketList markets={filteredMarkets} loading={false} />
        ) : (
          <MarketGrid markets={filteredMarkets} loading={false} />
        )}
      </div>
    </div>
  );
}
