import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

interface RouteParams {
  params: Promise<{ address: string }>;
}

// GET - Get business by wallet address
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { address } = await params;

    const { data, error } = await supabase
      .from('salvation_businesses')
      .select('*')
      .eq('wallet_address', address.toLowerCase())
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
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch business',
      },
      { status: 500 }
    );
  }
}

// PUT - Update business
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { address } = await params;
    const body = await request.json();
    const { name, website, description, founding_date, cover_image_url, pfp_image_url } = body;

    // Build update object with only provided fields
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (website !== undefined) updateData.website = website;
    if (description !== undefined) updateData.description = description;
    if (founding_date !== undefined) updateData.founding_date = founding_date;
    if (cover_image_url !== undefined) updateData.cover_image_url = cover_image_url;
    if (pfp_image_url !== undefined) updateData.pfp_image_url = pfp_image_url;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('salvation_businesses')
      .update(updateData)
      .eq('wallet_address', address.toLowerCase())
      .select()
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
  } catch (error) {
    console.error('Error updating business:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update business',
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete business
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { address } = await params;
    const walletAddress = address.toLowerCase();

    // Check if business has any applications
    const { count } = await supabase
      .from('salvation_project_applications')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_address', walletAddress);

    if (count && count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete business with ${count} existing application(s). Delete applications first.`,
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('salvation_businesses')
      .delete()
      .eq('wallet_address', walletAddress);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Business deleted' });
  } catch (error) {
    console.error('Error deleting business:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete business',
      },
      { status: 500 }
    );
  }
}
