'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface Business {
  wallet_address: string;
  name: string;
  website: string | null;
  description: string | null;
  founding_date: string | null;
  cover_image_url: string | null;
  pfp_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessFormData {
  name: string;
  website?: string;
  description?: string;
  founding_date?: string;
}

export interface ProjectApplication {
  id: string;
  wallet_address: string;
  project_name: string;
  description: string;
  category: string;
  image_url: string | null;
  country: string;
  region: string;
  funding_goal: number;
  bond_price: number;
  projected_apy: number;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'created';
  created_at: string;
}

// Fetch business by wallet address
async function fetchBusiness(walletAddress: string): Promise<Business | null> {
  const res = await fetch(`/api/business?wallet=${walletAddress}`);
  const data = await res.json();

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(data.error || 'Failed to fetch business');
  }

  return data.data;
}

// Fetch applications for a business
async function fetchApplications(walletAddress: string): Promise<ProjectApplication[]> {
  const res = await fetch(`/api/business/${walletAddress}/applications`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch applications');
  }

  return data.data || [];
}

// Create business
async function createBusiness(walletAddress: string, formData: BusinessFormData): Promise<Business> {
  const res = await fetch('/api/business', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wallet_address: walletAddress,
      ...formData,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to create business');
  }

  return data.data;
}

// Update business
async function updateBusiness(walletAddress: string, formData: Partial<BusinessFormData & { cover_image_url?: string; pfp_image_url?: string }>): Promise<Business> {
  const res = await fetch(`/api/business/${walletAddress}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to update business');
  }

  return data.data;
}

// Delete business
async function deleteBusiness(walletAddress: string): Promise<void> {
  const res = await fetch(`/api/business/${walletAddress}`, {
    method: 'DELETE',
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to delete business');
  }
}

// Upload image
async function uploadBusinessImage(
  walletAddress: string,
  file: File,
  type: 'cover' | 'pfp'
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('wallet_address', walletAddress);
  formData.append('type', type);

  const res = await fetch('/api/business/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Failed to upload image');
  }

  return data.data.url;
}

export function useBusiness(walletAddress: string | undefined) {
  const queryClient = useQueryClient();

  // Query for fetching business
  const {
    data: business,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['business', walletAddress],
    queryFn: () => fetchBusiness(walletAddress!),
    enabled: !!walletAddress,
  });

  // Query for fetching applications
  const {
    data: applications,
    isLoading: isLoadingApplications,
    refetch: refetchApplications,
  } = useQuery({
    queryKey: ['business-applications', walletAddress],
    queryFn: () => fetchApplications(walletAddress!),
    enabled: !!walletAddress && !!business,
  });

  // Mutation for creating business
  const createMutation = useMutation({
    mutationFn: (formData: BusinessFormData) => createBusiness(walletAddress!, formData),
    onSuccess: (data) => {
      queryClient.setQueryData(['business', walletAddress], data);
      toast.success('Business registered successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation for updating business
  const updateMutation = useMutation({
    mutationFn: (formData: Partial<BusinessFormData & { cover_image_url?: string; pfp_image_url?: string }>) =>
      updateBusiness(walletAddress!, formData),
    onSuccess: (data) => {
      queryClient.setQueryData(['business', walletAddress], data);
      toast.success('Business updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Mutation for deleting business
  const deleteMutation = useMutation({
    mutationFn: () => deleteBusiness(walletAddress!),
    onSuccess: () => {
      queryClient.setQueryData(['business', walletAddress], null);
      toast.success('Business deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Upload image handler
  const uploadImage = useCallback(async (file: File, type: 'cover' | 'pfp') => {
    if (!walletAddress) {
      toast.error('Not authenticated');
      return null;
    }

    try {
      toast.loading(`Uploading ${type} image...`, { id: `upload-${type}` });
      const url = await uploadBusinessImage(walletAddress, file, type);
      toast.success(`${type === 'cover' ? 'Cover' : 'Profile'} image uploaded!`, { id: `upload-${type}` });

      // Refetch business to get updated data
      refetch();

      return url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast.error(message, { id: `upload-${type}` });
      return null;
    }
  }, [walletAddress, refetch]);

  return {
    business,
    applications: applications || [],
    isLoading,
    isLoadingApplications,
    error: error as Error | null,
    isRegistered: !!business,

    // Actions
    register: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    uploadImage,
    refetch,
    refetchApplications,

    // Loading states
    isRegistering: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
