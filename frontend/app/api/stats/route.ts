import { NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';
import { GET_PLATFORM_STATS } from '@/lib/subgraph/queries';
import { SUBGRAPH_URL } from '@/lib/subgraph/config';

const client = new GraphQLClient(SUBGRAPH_URL);

export async function GET() {
  try {
    const data = await client.request(GET_PLATFORM_STATS);
    const { projects, markets, bondHolders } = data as any;

    // Calculate stats
    const totalProjects = projects?.length || 0;
    const fundedProjects = projects?.filter((p: any) =>
      p.status === 'active' || p.status === 'completed'
    ).length || 0;

    const totalFundingRaised = projects?.reduce((sum: number, p: any) =>
      sum + Number(p.fundingRaised) / 1e6, 0
    ) || 0;

    const avgAPY = totalProjects > 0
      ? projects.reduce((sum: number, p: any) =>
          sum + (p.projectedAPY ? Number(p.projectedAPY) / 100 : 10), 0
        ) / totalProjects
      : 0;

    const totalMarkets = markets?.length || 0;
    const activeMarkets = markets?.filter((m: any) => !m.resolved).length || 0;
    const resolvedMarkets = markets?.filter((m: any) => m.resolved).length || 0;

    const totalMarketVolume = markets?.reduce((sum: number, m: any) =>
      sum + Number(m.totalVolume) / 1e6, 0
    ) || 0;

    // Unique investors (bond holders)
    const uniqueInvestors = new Set(bondHolders?.map((h: any) => h.holder)).size;

    // Project status breakdown
    const statusBreakdown = projects?.reduce((acc: any, p: any) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalProjects,
          fundedProjects,
          totalFundingRaised: Math.round(totalFundingRaised * 100) / 100,
          averageAPY: Math.round(avgAPY * 10) / 10,
          uniqueInvestors,
        },
        markets: {
          total: totalMarkets,
          active: activeMarkets,
          resolved: resolvedMarkets,
          totalVolume: Math.round(totalMarketVolume * 100) / 100,
        },
        projectsByStatus: statusBreakdown,
        raw: {
          projectsCount: totalProjects,
          marketsCount: totalMarkets,
          bondHoldersCount: bondHolders?.length || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch stats',
      },
      { status: 500 }
    );
  }
}
