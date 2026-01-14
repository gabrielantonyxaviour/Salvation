import { NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';
import { GET_PROJECT } from '@/lib/subgraph/queries';
import { SUBGRAPH_URL } from '@/lib/subgraph/config';

const client = new GraphQLClient(SUBGRAPH_URL);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const data = await client.request(GET_PROJECT, { id });
    const raw = (data as any).project;

    if (!raw) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const project = {
      id: raw.id,
      name: raw.name || `Project ${raw.id.slice(0, 8)}`,
      description: raw.description || '',
      metadataURI: raw.metadataURI,
      sponsor: raw.sponsor,
      category: raw.category || 'water',
      status: raw.status || 'pending',
      fundingGoal: Number(raw.fundingGoal) / 1e6,
      fundingRaised: Number(raw.fundingRaised) / 1e6,
      bondPrice: Number(raw.bondPrice) / 1e6,
      projectedAPY: raw.projectedAPY ? Number(raw.projectedAPY) / 100 : 10,
      imageUrl: raw.imageUrl || '/images/projects/default.jpg',
      revenueModel: raw.revenueModel || '',
      createdAt: Number(raw.createdAt) * 1000,
      location: raw.location ? {
        country: raw.location.country || 'Unknown',
        region: raw.location.region || 'Unknown',
        coordinates: [
          raw.location.latitude ? parseFloat(raw.location.latitude) : 0,
          raw.location.longitude ? parseFloat(raw.location.longitude) : 0,
        ],
      } : null,
      bondToken: raw.bondToken ? {
        id: raw.bondToken.id,
        symbol: raw.bondToken.symbol,
        totalSupply: Number(raw.bondToken.totalSupply) / 1e18,
      } : null,
      market: raw.market ? {
        id: raw.market.id,
        question: raw.market.question,
        yesPrice: parseFloat(raw.market.yesPrice || '0.5'),
        noPrice: parseFloat(raw.market.noPrice || '0.5'),
        yesPool: Number(raw.market.yesPool) / 1e18,
        noPool: Number(raw.market.noPool) / 1e18,
        totalVolume: Number(raw.market.totalVolume) / 1e6,
        resolved: raw.market.resolved,
        outcome: raw.market.outcome,
      } : null,
      milestones: (raw.milestones || []).map((m: any) => ({
        index: Number(m.index),
        description: m.description,
        targetDate: Number(m.targetDate) * 1000,
        completed: m.completed,
        completedAt: m.completedAt ? Number(m.completedAt) * 1000 : null,
        evidenceURI: m.evidenceURI,
      })),
    };

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch project',
      },
      { status: 500 }
    );
  }
}
