'use client';

import { Card } from '@/components/ui/card';
import { Check, Circle, Clock } from 'lucide-react';
import type { Milestone } from '@/types';
import { format } from 'date-fns';

interface MilestoneTimelineProps {
  milestones: Milestone[];
}

// Demo milestones for display purposes
const DEMO_MILESTONES: Milestone[] = [
  {
    index: 0,
    description: 'Site Survey & Assessment',
    targetDate: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
    completed: true,
    completedAt: Date.now() - 55 * 24 * 60 * 60 * 1000,
    evidenceURI: 'ipfs://demo-evidence-1',
  },
  {
    index: 1,
    description: 'Equipment Procurement',
    targetDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    completed: true,
    completedAt: Date.now() - 28 * 24 * 60 * 60 * 1000,
    evidenceURI: 'ipfs://demo-evidence-2',
  },
  {
    index: 2,
    description: 'Installation & Setup',
    targetDate: Date.now() + 15 * 24 * 60 * 60 * 1000, // 15 days from now
    completed: false,
  },
  {
    index: 3,
    description: 'Operational Launch',
    targetDate: Date.now() + 45 * 24 * 60 * 60 * 1000, // 45 days from now
    completed: false,
  },
];

export function MilestoneTimeline({ milestones = DEMO_MILESTONES }: MilestoneTimelineProps) {
  const displayMilestones = milestones.length > 0 ? milestones : DEMO_MILESTONES;

  // Find current milestone (first incomplete)
  const currentIndex = displayMilestones.findIndex((m) => !m.completed);

  return (
    <Card className="p-6 bg-neutral-900/50 border-neutral-800">
      <h2 className="text-xl font-semibold text-white mb-6">Project Milestones</h2>

      <div className="space-y-6">
        {displayMilestones.map((milestone, index) => {
          const isCurrent = index === currentIndex;
          const isPast = milestone.completed;
          const isFuture = !milestone.completed && index > currentIndex;

          return (
            <div key={milestone.index} className="relative flex gap-4">
              {/* Connector Line */}
              {index < displayMilestones.length - 1 && (
                <div
                  className={`absolute left-[15px] top-[32px] w-0.5 h-[calc(100%+8px)] ${
                    isPast ? 'bg-green-500' : 'bg-neutral-700'
                  }`}
                />
              )}

              {/* Status Icon */}
              <div className="relative z-10 flex-shrink-0">
                {isPast ? (
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                ) : isCurrent ? (
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center animate-pulse">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                    <Circle className="w-4 h-4 text-neutral-400" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`font-medium ${
                      isPast
                        ? 'text-green-400'
                        : isCurrent
                        ? 'text-orange-400'
                        : 'text-neutral-400'
                    }`}
                  >
                    {milestone.description}
                  </h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded">
                      Current
                    </span>
                  )}
                </div>

                <p className="text-sm text-neutral-600 mt-1">
                  {isPast && milestone.completedAt
                    ? `Completed ${format(new Date(milestone.completedAt), 'MMM d, yyyy')}`
                    : `Target: ${format(new Date(milestone.targetDate), 'MMM d, yyyy')}`}
                </p>

                {/* Verification badge for completed milestones */}
                {isPast && milestone.evidenceURI && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Verified by Oracle
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Summary */}
      <div className="mt-6 pt-4 border-t border-neutral-800">
        <div className="flex justify-between text-sm">
          <span className="text-neutral-400">Progress</span>
          <span className="text-white">
            {displayMilestones.filter((m) => m.completed).length} / {displayMilestones.length} completed
          </span>
        </div>
        <div className="mt-2 h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-orange-500 transition-all duration-500"
            style={{
              width: `${
                (displayMilestones.filter((m) => m.completed).length / displayMilestones.length) * 100
              }%`,
            }}
          />
        </div>
      </div>
    </Card>
  );
}
