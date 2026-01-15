import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

interface RouteParams {
  params: Promise<{ address: string }>;
}

// GET - Get all applications for a business
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { address } = await params;

    const { data, error } = await supabase
      .from('salvation_project_applications')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch applications',
      },
      { status: 500 }
    );
  }
}
