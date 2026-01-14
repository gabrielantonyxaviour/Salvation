import { NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';
import { GET_ALL_PROJECTS } from '@/lib/subgraph/queries';
import { SUBGRAPH_URL } from '@/lib/subgraph/config';

const client = new GraphQLClient(SUBGRAPH_URL);

export async function GET() {
  try {
    const data = await client.request(GET_ALL_PROJECTS);
    const projects = (data as any).projects || [];

    // Transform to frontend format
    const transformedProjects = projects.map((raw: any) => ({
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
        totalVolume: Number(raw.market.totalVolume) / 1e6,
        resolved: raw.market.resolved,
      } : null,
      milestones: (raw.milestones || []).map((m: any) => ({
        index: Number(m.index),
        description: m.description,
        targetDate: Number(m.targetDate) * 1000,
        completed: m.completed,
        completedAt: m.completedAt ? Number(m.completedAt) * 1000 : null,
        evidenceURI: m.evidenceURI,
      })),
    }));

    return NextResponse.json({
      success: true,
      count: transformedProjects.length,
      data: transformedProjects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch projects',
      },
      { status: 500 }
    );
  }
}
