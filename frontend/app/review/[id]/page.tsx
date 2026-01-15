'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReviewChat } from '@/components/review';
import { useProjectReview, useBusiness } from '@/lib/hooks';
import { useProjectSubmit } from '@/lib/hooks';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Rocket,
  FileText,
  DollarSign,
  Calendar,
  MapPin,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReviewPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');

  const { application, messages, isLoading, approve, markCreated } = useProjectReview(id);
  const { submit: submitOnChain, isLoading: isCreating } = useProjectSubmit();

  // Fetch business info for the application owner
  const { business } = useBusiness(application?.wallet_address);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Card className="p-8 bg-neutral-900/50 border-neutral-800 text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">Login Required</h1>
          <p className="text-neutral-400 mb-6">
            Please login to view this application review.
          </p>
          <Button onClick={() => router.push('/sponsor')} className="bg-orange-500 hover:bg-orange-600">
            Go to Sponsor Page
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Card className="p-8 bg-neutral-900/50 border-neutral-800 text-center max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-4">Application Not Found</h1>
          <p className="text-neutral-400 mb-6">
            This application does not exist or has been deleted.
          </p>
          <Button onClick={() => router.push('/sponsor')} variant="outline" className="border-neutral-700 text-white">
            Back to Sponsor
          </Button>
        </Card>
      </div>
    );
  }

  const handleCreateProject = async () => {
    if (!application || application.status !== 'approved') return;

    // Create project on-chain using the approved values and business info
    const projectData = {
      orgName: business?.name || application.wallet_address.slice(0, 10),
      regNumber: '', // Not required for on-chain
      country: application.country,
      contactEmail: '', // Not required for on-chain
      projectName: application.project_name,
      category: application.category,
      projectCountry: application.country,
      region: application.region,
      coordinates: {
        lat: application.latitude?.toString() || '',
        lng: application.longitude?.toString() || '',
      },
      description: application.description,
      imageUrl: application.image_url || '',
      fundingGoal: (application.final_funding_goal || application.funding_goal).toString(),
      bondPrice: application.bond_price.toString(),
      revenueModel: application.revenue_model,
      projectedAPY: (application.final_projected_apy || application.projected_apy).toString(),
      milestones: (application.final_milestones || application.milestones).map((m: any) => ({
        description: m.description,
        date: m.target_date,
      })),
    };

    const projectId = await submitOnChain(projectData);
    if (projectId) {
      await markCreated(projectId, '');
      router.push(`/projects/${projectId}`);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{application.project_name}</h1>
            <p className="text-sm text-neutral-400">Application Review</p>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Panel */}
          <div className="lg:col-span-2">
            <ReviewChat applicationId={id} />
          </div>

          {/* Application Summary */}
          <div className="space-y-4">
            <Card className="p-4 bg-neutral-900/50 border-neutral-800">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-500" />
                Application Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-neutral-400">Category</p>
                  <p className="text-white capitalize">{application.category}</p>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-white">{application.region}, {application.country}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-white">
                      ${(application.final_funding_goal || application.funding_goal).toLocaleString()}
                    </p>
                    <p className="text-neutral-400">
                      {application.final_projected_apy || application.projected_apy}% APY
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-neutral-400 mt-0.5" />
                  <div>
                    <p className="text-white">
                      {(application.final_milestones || application.milestones).length} Milestones
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Action Panel */}
            {application.status === 'approved' && (
              <Card className="p-4 bg-green-500/10 border-green-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <h3 className="text-green-400 font-medium">Application Approved</h3>
                </div>
                <p className="text-sm text-neutral-300 mb-4">
                  Your application has been approved. You can now create the project on-chain.
                </p>
                <Button
                  onClick={handleCreateProject}
                  disabled={isCreating}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-4 h-4 mr-2" />
                      Create Project
                    </>
                  )}
                </Button>
              </Card>
            )}

            {application.status === 'created' && (
              <Card className="p-4 bg-blue-500/10 border-blue-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Rocket className="w-5 h-5 text-blue-500" />
                  <h3 className="text-blue-400 font-medium">Project Created</h3>
                </div>
                <p className="text-sm text-neutral-300 mb-4">
                  Your project is now live on-chain!
                </p>
                <Button
                  onClick={() => router.push(`/projects/${application.project_id}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  View Project
                </Button>
              </Card>
            )}

            {application.status === 'rejected' && (
              <Card className="p-4 bg-red-500/10 border-red-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <h3 className="text-red-400 font-medium">Application Rejected</h3>
                </div>
                <p className="text-sm text-neutral-300">
                  Unfortunately, this application did not meet the requirements.
                  Please review the feedback and consider submitting a new application.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { color: 'bg-yellow-500/20 text-yellow-400', label: 'Pending' },
    in_review: { color: 'bg-orange-500/20 text-orange-400', label: 'In Review' },
    approved: { color: 'bg-green-500/20 text-green-400', label: 'Approved' },
    rejected: { color: 'bg-red-500/20 text-red-400', label: 'Rejected' },
    created: { color: 'bg-blue-500/20 text-blue-400', label: 'Created' },
  }[status] || { color: 'bg-neutral-500/20 text-neutral-400', label: status };

  return (
    <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
