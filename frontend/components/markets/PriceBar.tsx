'use client';

import { cn } from '@/lib/utils';

interface PriceBarProps {
  yesPrice: number;
  noPrice: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

export function PriceBar({
  yesPrice,
  noPrice,
  size = 'md',
  showLabels = true,
  className,
}: PriceBarProps) {
  const yesPercent = Math.round(yesPrice * 100);
  const noPercent = Math.round(noPrice * 100);

  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('w-full', className)}>
      {showLabels && (
        <div className={cn('flex justify-between mb-1', textClasses[size])}>
          <span className="text-green-400 font-medium">YES {yesPercent}%</span>
          <span className="text-red-400 font-medium">{noPercent}% NO</span>
        </div>
      )}
      <div className={cn('w-full bg-neutral-800 rounded-full flex overflow-hidden', heightClasses[size])}>
        <div
          className="bg-green-500 transition-all duration-300"
          style={{ width: `${yesPercent}%` }}
        />
        <div
          className="bg-red-500 transition-all duration-300"
          style={{ width: `${noPercent}%` }}
        />
      </div>
    </div>
  );
}
