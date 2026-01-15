'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useYield } from '@/lib/contracts/hooks';
import { Loader2 } from 'lucide-react';
import type { BondHolding } from '@/types';

interface BondListProps {
  holdings: BondHolding[];
  onClaimSuccess?: () => void;
}

function BondRow({ holding, onClaimSuccess }: { holding: BondHolding; onClaimSuccess?: () => void }) {
  const { claim, isClaiming } = useYield(holding.projectId);

  const handleClaim = async () => {
    await claim(holding.projectId);
    onClaimSuccess?.();
  };

  return (
    <tr className="hover:bg-neutral-800/30 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg bg-cover bg-center bg-neutral-800"
            style={{ backgroundImage: `url(${holding.imageUrl})` }}
          />
          <div>
            <Link
              href={`/projects/${holding.projectId}`}
              className="text-white hover:text-orange-400 font-medium"
            >
              {holding.projectName}
            </Link>
            <p className="text-xs text-neutral-400 capitalize">{holding.category}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-white font-medium">
        {holding.balance.toLocaleString()}
      </td>
      <td className="px-6 py-4 text-white">
        ${holding.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </td>
      <td className="px-6 py-4">
        <span className="text-green-400">{holding.apy.toFixed(1)}%</span>
      </td>
      <td className="px-6 py-4">
        <span className="text-green-400">
          ${holding.claimableYield.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </td>
      <td className="px-6 py-4">
        <Button
          size="sm"
          onClick={handleClaim}
          disabled={holding.claimableYield === 0 || isClaiming}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 shadow-lg shadow-green-600/25"
        >
          {isClaiming ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Claiming...
            </>
          ) : (
            'Claim'
          )}
        </Button>
      </td>
    </tr>
  );
}

export function BondList({ holdings, onClaimSuccess }: BondListProps) {
  if (holdings.length === 0) {
    return (
      <Card className="p-8 bg-neutral-900/50 border-neutral-800 text-center">
        <p className="text-neutral-400 mb-4">You don't own any bonds yet.</p>
        <Link href="/projects">
          <Button className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25">
            Browse Projects
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="bg-neutral-900/50 border-neutral-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-neutral-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Bonds
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                APY
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Claimable
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {holdings.map((holding) => (
              <BondRow
                key={holding.projectId}
                holding={holding}
                onClaimSuccess={onClaimSuccess}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
