import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

// GET - List all businesses or get by wallet address (query param)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');

    if (walletAddress) {
      // Get specific business by wallet
      const { data, error } = await supabase
        .from('salvation_businesses')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return NextResponse.json(
            { success: false, error: 'Business not found' },
            { status: 404 }
          );
        }
        throw error;
      }

      return NextResponse.json({ success: true, data });
    }

    // List all businesses
    const { data, error } = await supabase
      .from('salvation_businesses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch businesses',
      },
      { status: 500 }
    );
  }
}

// POST - Create a new business
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet_address, name, website, description, founding_date } = body;

    if (!wallet_address || !name) {
      return NextResponse.json(
        { success: false, error: 'wallet_address and name are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('salvation_businesses')
      .insert({
        wallet_address: wallet_address.toLowerCase(),
        name,
        website: website || null,
        description: description || null,
        founding_date: founding_date || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Business with this wallet already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error creating business:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create business',
      },
      { status: 500 }
    );
  }
}
