import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get application details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const { data: application, error } = await supabase
      .from('salvation_project_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Application not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Get conversation count
    const { count } = await supabase
      .from('salvation_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('application_id', id);

    return NextResponse.json({
      success: true,
      data: {
        ...application,
        message_count: count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

// PUT - Update application (approve/reject/update final values)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, final_funding_goal, final_projected_apy, final_milestones, agent_analysis } = body;

    // Get current application
    const { data: application, error: fetchError } = await supabase
      .from('salvation_project_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    const updateData: Record<string, any> = {};

    if (action === 'approve') {
      updateData.status = 'approved';
      updateData.final_funding_goal = final_funding_goal || application.funding_goal;
      updateData.final_projected_apy = final_projected_apy || application.projected_apy;
      updateData.final_milestones = final_milestones || application.milestones;
      if (agent_analysis) {
        updateData.agent_analysis = agent_analysis;
      }
    } else if (action === 'reject') {
      updateData.status = 'rejected';
      if (agent_analysis) {
        updateData.agent_analysis = agent_analysis;
      }
    } else if (action === 'update') {
      // Allow updating final values during negotiation
      if (final_funding_goal !== undefined) updateData.final_funding_goal = final_funding_goal;
      if (final_projected_apy !== undefined) updateData.final_projected_apy = final_projected_apy;
      if (final_milestones !== undefined) updateData.final_milestones = final_milestones;
    } else if (action === 'created') {
      // Mark as created after on-chain transaction
      updateData.status = 'created';
      if (body.project_id) updateData.project_id = body.project_id;
      if (body.tx_hash) updateData.tx_hash = body.tx_hash;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    const { data: updated, error: updateError } = await supabase
      .from('salvation_project_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

// DELETE - Delete application (only if pending or rejected)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check application status
    const { data: application } = await supabase
      .from('salvation_project_applications')
      .select('status')
      .eq('id', id)
      .single();

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    if (!['pending', 'in_review', 'rejected'].includes(application.status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete approved or created applications' },
        { status: 400 }
      );
    }

    // Delete conversations first (cascade should handle this, but explicit)
    await supabase
      .from('salvation_conversations')
      .delete()
      .eq('application_id', id);

    // Delete application
    const { error } = await supabase
      .from('salvation_project_applications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Application deleted' });
  } catch (error) {
    console.error('Error deleting application:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete application' },
      { status: 500 }
    );
  }
}
