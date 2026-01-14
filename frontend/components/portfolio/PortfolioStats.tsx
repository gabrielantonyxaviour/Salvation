'use client';

import { Card } from '@/components/ui/card';
import { Wallet, TrendingUp, Percent, BarChart3 } from 'lucide-react';

interface PortfolioStatsProps {
  totalBondValue: number;
  totalClaimableYield: number;
  averageAPY: number;
  totalPositionValue: number;
}

export function PortfolioStats({
  totalBondValue,
  totalClaimableYield,
  averageAPY,
  totalPositionValue,
}: PortfolioStatsProps) {
  const stats = [
    {
      label: 'Total Bond Value',
      value: `$${totalBondValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Wallet,
      color: 'text-white',
    },
    {
      label: 'Claimable Yield',
      value: `$${totalClaimableYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-green-400',
    },
    {
      label: 'Average APY',
      value: `${averageAPY.toFixed(1)}%`,
      icon: Percent,
      color: 'text-orange-400',
    },
    {
      label: 'Positions Value',
      value: `$${totalPositionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: BarChart3,
      color: 'text-blue-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="p-4 bg-neutral-900/50 border-neutral-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-neutral-400">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
            <stat.icon className={`w-5 h-5 ${stat.color} opacity-50`} />
          </div>
        </Card>
      ))}
    </div>
  );
}
