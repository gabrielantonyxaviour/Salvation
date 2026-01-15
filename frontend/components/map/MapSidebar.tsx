'use client';

import { useState } from 'react';
import { X, Search, Share2, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Project,
  MapFilter,
  ProjectCategory,
  ProjectStatus,
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  PROJECT_CATEGORY_COLORS
} from '@/types/project';
import { toast } from 'sonner';

// Supported countries
const SUPPORTED_COUNTRIES = [
  { name: 'Kenya', emoji: '🇰🇪' },
  { name: 'Nigeria', emoji: '🇳🇬' },
  { name: 'South Africa', emoji: '🇿🇦' },
  { name: 'Ghana', emoji: '🇬🇭' },
  { name: 'Ethiopia', emoji: '🇪🇹' },
  { name: 'Egypt', emoji: '🇪🇬' },
  { name: 'Tanzania', emoji: '🇹🇿' },
  { name: 'Uganda', emoji: '🇺🇬' },
];

interface MapSidebarProps {
  selectedProject: Project | null;
  onProjectDeselect: () => void;
  filters: MapFilter;
  onFiltersChange: (filters: MapFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  projects: Project[];
  onProjectSelect: (project: Project) => void;
}

export default function MapSidebar({
  selectedProject,
  onProjectDeselect,
  filters,
  onFiltersChange,
  searchQuery,
  onSearchChange,
  projects,
  onProjectSelect
}: MapSidebarProps) {
  const [expandedFilter, setExpandedFilter] = useState<'category' | 'country' | 'status' | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleShare = (project: Project) => {
    const url = `${window.location.origin}/map?project=${project.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const toggleCategory = (category: ProjectCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const toggleCountry = (country: string) => {
    const newCountries = filters.countries.includes(country)
      ? filters.countries.filter(c => c !== country)
      : [...filters.countries, country];
    onFiltersChange({ ...filters, countries: newCountries });
  };

  const toggleStatus = (status: ProjectStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const resetFilters = () => {
    onFiltersChange({ categories: [], countries: [], statuses: [] });
  };

  const hasActiveFilters = filters.categories.length > 0 ||
                          filters.countries.length > 0 ||
                          filters.statuses.length > 0;

  // Filter projects based on search query
  const searchResults = searchQuery.trim()
    ? projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location.region?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.location.country?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const categoryList: ProjectCategory[] = ['water', 'solar', 'education', 'healthcare', 'agriculture'];
  const statusList: ProjectStatus[] = ['pending', 'funding', 'active', 'completed', 'failed'];

  return (
    <div className="w-80 h-full flex flex-col bg-neutral-950 border-r border-neutral-800">
      {/* Header */}
      <div className="px-6 py-6 border-b border-neutral-800">
        <h2 className="text-xl md:text-2xl font-bold text-white">
          Project Map
        </h2>
        <p className="text-sm mt-1 text-neutral-400">
          Explore projects across Africa
        </p>
      </div>

      {/* Search Bar */}
      <div className="px-6 py-4 border-b border-neutral-800 relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowSearchResults(e.target.value.trim().length > 0);
            }}
            onFocus={() => setShowSearchResults(searchQuery.trim().length > 0)}
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange('');
                setShowSearchResults(false);
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div className="absolute left-6 right-6 mt-2 rounded-lg overflow-hidden shadow-lg z-50 max-h-96 overflow-y-auto bg-neutral-900 border border-neutral-800">
            {searchResults.map((project) => (
              <div
                key={project.id}
                onClick={() => {
                  onProjectSelect(project);
                  setShowSearchResults(false);
                  onSearchChange('');
                }}
                className="p-3 cursor-pointer border-b border-neutral-800 hover:bg-orange-500/10 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                    style={{ backgroundColor: PROJECT_CATEGORY_COLORS[project.category] }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-white truncate">
                      {project.name}
                    </div>
                    <div className="text-xs mt-0.5 text-neutral-500">
                      {project.location.region}, {project.location.country}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showSearchResults && searchQuery.trim() && searchResults.length === 0 && (
          <div className="absolute left-6 right-6 mt-2 p-4 rounded-lg text-center text-sm bg-neutral-900 border border-neutral-800 text-neutral-400">
            No projects found
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">
              Filters
            </h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-orange-500 hover:text-orange-400 hover:underline"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="mb-3">
            <button
              onClick={() => setExpandedFilter(expandedFilter === 'category' ? null : 'category')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
            >
              <span className="text-sm font-medium text-white">Category</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">
                  {filters.categories.length > 0 ? `${filters.categories.length} selected` : 'All'}
                </span>
                {expandedFilter === 'category' ? (
                  <ChevronUp className="w-4 h-4 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                )}
              </div>
            </button>
            {expandedFilter === 'category' && (
              <div className="mt-2 space-y-1 p-2 bg-neutral-900/50 rounded-lg">
                {categoryList.map((category) => {
                  const isSelected = filters.categories.includes(category);
                  return (
                    <div
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-all ${
                        isSelected ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: PROJECT_CATEGORY_COLORS[category] }}
                      />
                      <span className="text-sm capitalize">{CATEGORY_CONFIG[category].label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Country Filter */}
          <div className="mb-3">
            <button
              onClick={() => setExpandedFilter(expandedFilter === 'country' ? null : 'country')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
            >
              <span className="text-sm font-medium text-white">Country</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">
                  {filters.countries.length > 0 ? `${filters.countries.length} selected` : 'All'}
                </span>
                {expandedFilter === 'country' ? (
                  <ChevronUp className="w-4 h-4 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                )}
              </div>
            </button>
            {expandedFilter === 'country' && (
              <div className="mt-2 max-h-48 overflow-y-auto space-y-1 p-2 bg-neutral-900/50 rounded-lg">
                {SUPPORTED_COUNTRIES.map((country) => {
                  const isSelected = filters.countries.includes(country.name);
                  return (
                    <div
                      key={country.name}
                      onClick={() => toggleCountry(country.name)}
                      className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-all ${
                        isSelected ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <span className="text-base">{country.emoji}</span>
                      <span className="text-sm">{country.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="mb-3">
            <button
              onClick={() => setExpandedFilter(expandedFilter === 'status' ? null : 'status')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors"
            >
              <span className="text-sm font-medium text-white">Status</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">
                  {filters.statuses.length > 0 ? `${filters.statuses.length} selected` : 'All'}
                </span>
                {expandedFilter === 'status' ? (
                  <ChevronUp className="w-4 h-4 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-500" />
                )}
              </div>
            </button>
            {expandedFilter === 'status' && (
              <div className="mt-2 space-y-1 p-2 bg-neutral-900/50 rounded-lg">
                {statusList.map((status) => {
                  const isSelected = filters.statuses.includes(status);
                  return (
                    <div
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className={`flex items-center gap-3 px-3 py-2 rounded cursor-pointer transition-all capitalize ${
                        isSelected ? 'bg-orange-500 text-white' : 'text-neutral-400 hover:bg-neutral-800'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].color}`}
                      />
                      <span className="text-sm">{STATUS_CONFIG[status].label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Selected Project Details */}
        {selectedProject && (
          <Card className="p-4 bg-neutral-900 border-2 border-orange-500">
            <div className="flex items-start justify-between mb-3">
              <Badge
                className="text-white"
                style={{ backgroundColor: PROJECT_CATEGORY_COLORS[selectedProject.category] }}
              >
                {CATEGORY_CONFIG[selectedProject.category].label}
              </Badge>
              <button
                onClick={onProjectDeselect}
                className="text-neutral-500 hover:text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="font-semibold mb-2 text-white text-lg">
              {selectedProject.name}
            </h4>
            <p className="text-sm mb-3 line-clamp-3 text-neutral-400">
              {selectedProject.description}
            </p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Location</span>
                <span className="font-medium text-white">
                  {selectedProject.location.region}, {selectedProject.location.country}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Projected APY</span>
                <span className="font-medium text-green-400">
                  {selectedProject.projectedAPY}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Status</span>
                <Badge className={`${STATUS_CONFIG[selectedProject.status].color} text-white text-xs`}>
                  {STATUS_CONFIG[selectedProject.status].label}
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-neutral-500">Funding Progress</span>
                <span className="font-medium text-white">
                  {Math.round((selectedProject.fundingRaised / selectedProject.fundingGoal) * 100)}%
                </span>
              </div>
              <Progress
                value={Math.min((selectedProject.fundingRaised / selectedProject.fundingGoal) * 100, 100)}
                className="h-2"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>${selectedProject.fundingRaised.toLocaleString()}</span>
                <span>${selectedProject.fundingGoal.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Link href={`/projects/${selectedProject.id}`} className="flex-1">
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25">
                  View Details
                </Button>
              </Link>
              <Button
                onClick={() => handleShare(selectedProject)}
                variant="outline"
                className="px-3 border-neutral-700 text-white hover:bg-neutral-800"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
