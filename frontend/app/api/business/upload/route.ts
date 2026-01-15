import { NextRequest, NextResponse } from 'next/server';
import { supabase, IMAGES_BUCKET, getImagePublicUrl } from '@/lib/supabase/client';

// POST - Upload image to storage
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const walletAddress = formData.get('wallet_address') as string;
    const imageType = formData.get('type') as 'cover' | 'pfp';

    if (!file || !walletAddress || !imageType) {
      return NextResponse.json(
        { success: false, error: 'file, wallet_address, and type are required' },
        { status: 400 }
      );
    }

    if (!['cover', 'pfp'].includes(imageType)) {
      return NextResponse.json(
        { success: false, error: 'type must be "cover" or "pfp"' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: jpeg, png, webp, gif' },
        { status: 400 }
      );
    }

    // Max file size: 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${walletAddress.toLowerCase()}/${imageType}_${Date.now()}.${ext}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const publicUrl = getImagePublicUrl(filename);

    // Update business record with new image URL
    const updateField = imageType === 'cover' ? 'cover_image_url' : 'pfp_image_url';
    const { error: updateError } = await supabase
      .from('salvation_businesses')
      .update({ [updateField]: publicUrl })
      .eq('wallet_address', walletAddress.toLowerCase());

    if (updateError) {
      console.error('Error updating business with image URL:', updateError);
      // Image was uploaded but record update failed - still return the URL
    }

    return NextResponse.json({
      success: true,
      data: {
        path: uploadData.path,
        url: publicUrl,
        type: imageType,
      },
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image',
      },
      { status: 500 }
    );
  }
}
