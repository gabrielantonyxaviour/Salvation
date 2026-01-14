import { NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';
import { GET_MARKET } from '@/lib/subgraph/queries';
import { SUBGRAPH_URL } from '@/lib/subgraph/config';

const client = new GraphQLClient(SUBGRAPH_URL);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const data = await client.request(GET_MARKET, { id });
    const raw = (data as any).market;

    if (!raw) {
      return NextResponse.json(
        { success: false, error: 'Market not found' },
        { status: 404 }
      );
    }

    const market = {
      id: raw.id,
      address: raw.id,
      projectId: raw.project?.id || '',
      projectName: raw.project?.name || 'Unknown Project',
      projectCategory: raw.project?.category || 'unknown',
      projectStatus: raw.project?.status || 'unknown',
      question: raw.question || '',
      yesPrice: parseFloat(raw.yesPrice || '0.5'),
      noPrice: parseFloat(raw.noPrice || '0.5'),
      yesPool: Number(raw.yesPool) / 1e18,
      noPool: Number(raw.noPool) / 1e18,
      totalVolume: Number(raw.totalVolume) / 1e6,
      resolved: raw.resolved || false,
      outcome: raw.outcome,
      createdAt: Number(raw.createdAt) * 1000,
      resolvedAt: raw.resolvedAt ? Number(raw.resolvedAt) * 1000 : null,
      trades: (raw.trades || []).map((t: any) => ({
        id: t.id,
        trader: t.trader,
        isYes: t.isYes,
        isBuy: t.isBuy,
        amount: Number(t.amount) / 1e18,
        cost: Number(t.cost) / 1e6,
        timestamp: Number(t.timestamp) * 1000,
      })),
    };

    return NextResponse.json({
      success: true,
      data: market,
    });
  } catch (error) {
    console.error('Error fetching market:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch market',
      },
      { status: 500 }
    );
  }
}
