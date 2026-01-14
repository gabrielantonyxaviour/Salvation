import { NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';
import { GET_ALL_MARKETS } from '@/lib/subgraph/queries';
import { SUBGRAPH_URL } from '@/lib/subgraph/config';

const client = new GraphQLClient(SUBGRAPH_URL);

export async function GET() {
  try {
    const data = await client.request(GET_ALL_MARKETS);
    const markets = (data as any).markets || [];

    const transformedMarkets = markets.map((raw: any) => ({
      id: raw.id,
      address: raw.id,
      projectId: raw.project?.id || '',
      projectName: raw.project?.name || 'Unknown Project',
      projectCategory: raw.project?.category || 'unknown',
      question: raw.question || '',
      yesPrice: parseFloat(raw.yesPrice || '0.5'),
      noPrice: parseFloat(raw.noPrice || '0.5'),
      yesPool: Number(raw.yesPool) / 1e18,
      noPool: Number(raw.noPool) / 1e18,
      totalVolume: Number(raw.totalVolume) / 1e6,
      resolved: raw.resolved || false,
      outcome: raw.outcome,
      createdAt: Number(raw.createdAt) * 1000,
      trades: (raw.trades || []).map((t: any) => ({
        id: t.id,
        trader: t.trader,
        isYes: t.isYes,
        isBuy: t.isBuy,
        amount: Number(t.amount) / 1e18,
        cost: Number(t.cost) / 1e6,
        timestamp: Number(t.timestamp) * 1000,
      })),
    }));

    return NextResponse.json({
      success: true,
      count: transformedMarkets.length,
      data: transformedMarkets,
    });
  } catch (error) {
    console.error('Error fetching markets:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch markets',
      },
      { status: 500 }
    );
  }
}
