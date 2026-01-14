'use client';

import { useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import { encodeFunctionData, parseUnits } from 'viem';
import { mantleSepoliaContracts, areContractsDeployed, MANTLE_SEPOLIA_CHAIN_ID } from '../contracts/deployments';
import { ProjectRegistryABI } from '../contracts/abis';
import { toast } from 'sonner';
import { uploadToIPFS } from '../ipfs/upload';

export interface ProjectFormData {
  // Step 1: Business Info (Mock KYB)
  orgName: string;
  regNumber: string;
  country: string;
  contactEmail: string;
  // Step 2: Project Details
  projectName: string;
  category: string;
  projectCountry: string;
  region: string;
  coordinates: { lat: string; lng: string };
  description: string;
  imageUrl: string;
  // Step 3: Funding
  fundingGoal: string;
  bondPrice: string;
  revenueModel: string;
  projectedAPY: string;
  // Step 4: Milestones
  milestones: { description: string; date: string }[];
}

interface UseProjectSubmitReturn {
  submit: (formData: ProjectFormData) => Promise<string | null>;
  isLoading: boolean;
  projectId: string | null;
  error: string | null;
}

export function useProjectSubmit(): UseProjectSubmitReturn {
  const { authenticated, sendTransaction } = usePrivy();
  const { wallets } = useWallets();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');

  const submit = useCallback(async (formData: ProjectFormData): Promise<string | null> => {
    if (!embeddedWallet || !authenticated) {
      toast.error('Please login first');
      setError('Not authenticated');
      return null;
    }

    if (!areContractsDeployed(MANTLE_SEPOLIA_CHAIN_ID)) {
      // In demo mode, simulate successful submission
      toast.loading('Submitting project...', { id: 'project-submit' });
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockProjectId = `0x${Math.random().toString(16).slice(2, 10)}`;
      setProjectId(mockProjectId);
      toast.success('Project submitted successfully! (Demo Mode)', { id: 'project-submit' });
      return mockProjectId;
    }

    setIsLoading(true);
    setError(null);

    try {
      toast.loading('Uploading metadata to IPFS...', { id: 'project-submit' });

      // Prepare project metadata
      const metadata = {
        name: formData.projectName,
        description: formData.description,
        category: formData.category,
        location: {
          country: formData.projectCountry,
          region: formData.region,
          coordinates: [
            parseFloat(formData.coordinates.lat) || 0,
            parseFloat(formData.coordinates.lng) || 0,
          ],
        },
        imageUrl: formData.imageUrl,
        revenueModel: formData.revenueModel,
        projectedAPY: parseFloat(formData.projectedAPY) || 0,
        sponsor: {
          orgName: formData.orgName,
          regNumber: formData.regNumber,
          country: formData.country,
          contactEmail: formData.contactEmail,
        },
        milestones: formData.milestones.map((m, i) => ({
          index: i,
          description: m.description,
          targetDate: new Date(m.date).getTime(),
        })),
        createdAt: Date.now(),
      };

      // Upload to IPFS
      let metadataURI: string;
      try {
        metadataURI = await uploadToIPFS(metadata);
      } catch {
        // Fallback to a mock URI if IPFS upload fails
        metadataURI = `ipfs://Qm${Math.random().toString(36).slice(2, 46)}`;
        console.warn('IPFS upload failed, using mock URI');
      }

      toast.loading('Registering project on-chain...', { id: 'project-submit' });

      // Convert funding goal to USDC (6 decimals)
      const fundingGoal = parseUnits(formData.fundingGoal || '0', 6);
      const bondPrice = parseUnits(formData.bondPrice || '1', 6);

      // Encode the registerProject function call
      const data = encodeFunctionData({
        abi: ProjectRegistryABI,
        functionName: 'registerProject',
        args: [metadataURI, fundingGoal, bondPrice],
      });

      // Send transaction via Privy
      const txResult = await sendTransaction({
        to: mantleSepoliaContracts.projectRegistry,
        data,
      });

      // Get project ID from transaction receipt
      // For now, generate a temporary ID based on timestamp
      const newProjectId = `0x${Date.now().toString(16)}`;
      setProjectId(newProjectId);

      toast.success('Project submitted successfully!', { id: 'project-submit' });

      // Invalidate projects query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['projects'] });

      return newProjectId;
    } catch (err) {
      console.error('Project submission error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit project';
      setError(errorMessage);
      toast.error(errorMessage, { id: 'project-submit' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [embeddedWallet, authenticated, sendTransaction, queryClient]);

  return {
    submit,
    isLoading,
    projectId,
    error,
  };
}
