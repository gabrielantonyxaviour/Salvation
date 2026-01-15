import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export interface ProjectApplicationInput {
  wallet_address: string;
  project_name: string;
  description: string;
  category: string;
  image_url?: string;
  country: string;
  region: string;
  latitude?: number;
  longitude?: number;
  funding_goal: number;
  bond_price?: number;
  revenue_model: string;
  projected_apy: number;
  milestones: { description: string; target_date: string }[];
}

// POST - Submit a new project application for review
export async function POST(request: NextRequest) {
  try {
    const body: ProjectApplicationInput = await request.json();

    // Validate required fields
    const required = ['wallet_address', 'project_name', 'description', 'category', 'country', 'region', 'funding_goal', 'revenue_model', 'projected_apy', 'milestones'];
    for (const field of required) {
      if (!(field in body) || body[field as keyof ProjectApplicationInput] === undefined) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    if (!body.milestones || body.milestones.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 milestones are required' },
        { status: 400 }
      );
    }

    // Create the application
    const { data: application, error } = await supabase
      .from('salvation_project_applications')
      .insert({
        wallet_address: body.wallet_address.toLowerCase(),
        project_name: body.project_name,
        description: body.description,
        category: body.category,
        image_url: body.image_url || null,
        country: body.country,
        region: body.region,
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        funding_goal: body.funding_goal,
        bond_price: body.bond_price || 1.0,
        revenue_model: body.revenue_model,
        projected_apy: body.projected_apy,
        milestones: body.milestones,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating application:', error);
      throw error;
    }

    // Create initial system message for the conversation
    const systemMessage = `You are reviewing a project application for "${body.project_name}" - a ${body.category} project in ${body.region}, ${body.country}. The applicant is requesting $${body.funding_goal.toLocaleString()} in funding with a projected APY of ${body.projected_apy}%. Analyze this application thoroughly and provide feedback.`;

    await supabase.from('salvation_conversations').insert({
      application_id: application.id,
      role: 'system',
      content: systemMessage,
    });

    return NextResponse.json(
      {
        success: true,
        data: application,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit application',
      },
      { status: 500 }
    );
  }
}
