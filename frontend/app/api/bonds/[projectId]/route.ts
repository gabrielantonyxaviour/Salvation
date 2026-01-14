import { NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';
import { GET_BOND_HOLDERS } from '@/lib/subgraph/queries';
import { SUBGRAPH_URL } from '@/lib/subgraph/config';

const client = new GraphQLClient(SUBGRAPH_URL);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const data = await client.request(GET_BOND_HOLDERS, { projectId });
    const bondHolders = (data as any).bondHolders || [];

    const transformedHolders = bondHolders.map((raw: any) => ({
      id: raw.id,
      holder: raw.holder,
      balance: Number(raw.balance) / 1e18, // Bond tokens have 18 decimals
      lastActivity: raw.lastActivity ? Number(raw.lastActivity) * 1000 : null,
    }));

    // Calculate summary stats
    const totalHolders = transformedHolders.length;
    const totalBondsHeld = transformedHolders.reduce(
      (sum: number, h: any) => sum + h.balance,
      0
    );

    return NextResponse.json({
      success: true,
      data: transformedHolders,
      summary: {
        totalHolders,
        totalBondsHeld: Math.round(totalBondsHeld * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Error fetching bond holders:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bond holders',
      },
      { status: 500 }
    );
  }
}
