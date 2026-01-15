'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectForm, BusinessRegistrationForm } from '@/components/sponsor';
import { useBusiness, type ProjectApplication } from '@/lib/hooks';
import {
  Building2,
  Loader2,
  Plus,
  Calendar,
  Globe,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  ArrowLeft,
  Pencil,
} from 'lucide-react';

// Status badge component
function StatusBadge({ status }: { status: ProjectApplication['status'] }) {
  const config = {
    pending: { color: 'bg-yellow-500/20 text-yellow-500', label: 'Pending' },
    in_review: { color: 'bg-blue-500/20 text-blue-500', label: 'In Review' },
    approved: { color: 'bg-green-500/20 text-green-500', label: 'Approved' },
    rejected: { color: 'bg-red-500/20 text-red-500', label: 'Rejected' },
    created: { color: 'bg-orange-500/20 text-orange-500', label: 'On-Chain' },
  };

  const { color, label } = config[status];

  return (
    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${color}`}>
      {label}
    </span>
  );
}

// Application card component
function ApplicationCard({ application }: { application: ProjectApplication }) {
  const router = useRouter();

  const handleClick = () => {
    if (application.status === 'created') {
      router.push(`/projects/${application.id}`);
    } else {
      router.push(`/review/${application.id}`);
    }
  };

  return (
    <Card
      className="p-3 sm:p-4 bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <h3 className="text-sm sm:text-base font-semibold text-white truncate">{application.project_name}</h3>
            <StatusBadge status={application.status} />
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 line-clamp-2 mb-1.5 sm:mb-2">{application.description}</p>
          <div className="flex flex-wrap gap-2 sm:gap-3 text-[10px] sm:text-xs text-neutral-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {application.region}, {application.country}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {application.category}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              {new Date(application.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm sm:text-base lg:text-lg font-bold text-white">${application.funding_goal.toLocaleString()}</div>
          <div className="text-[10px] sm:text-xs text-neutral-400">{application.projected_apy}% APY</div>
        </div>
      </div>
    </Card>
  );
}

// Business profile header
function BusinessProfile({
  business,
  walletAddress,
  onEdit,
}: {
  business: {
    name: string;
    description: string | null;
    website: string | null;
    founding_date: string | null;
    cover_image_url: string | null;
    pfp_image_url: string | null;
  };
  walletAddress: string;
  onEdit: () => void;
}) {
  return (
    <div className="mb-6 lg:mb-8">
      {/* Cover Image */}
      <div className="relative h-32 sm:h-40 md:h-48 lg:h-56 rounded-lg lg:rounded-xl overflow-hidden bg-neutral-800">
        {business.cover_image_url ? (
          <img
            src={business.cover_image_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-neutral-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 to-transparent" />
      </div>

      {/* Profile Section */}
      <div className="relative px-3 sm:px-4 md:px-6 -mt-12 sm:-mt-14 lg:-mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          {/* Profile Picture */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-lg lg:rounded-xl border-3 lg:border-4 border-neutral-950 overflow-hidden bg-neutral-800 shrink-0">
            {business.pfp_image_url ? (
              <img
                src={business.pfp_image_url}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-orange-500/20">
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-orange-500" />
              </div>
            )}
          </div>

          {/* Business Info */}
          <div className="flex-1 pb-1 sm:pb-2">
            <div className="flex items-start justify-between gap-2 sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">{business.name}</h1>
                {business.description && (
                  <p className="text-xs sm:text-sm text-neutral-400 mt-0.5 sm:mt-1 line-clamp-2 max-w-2xl">{business.description}</p>
                )}
                <div className="flex flex-wrap gap-2 sm:gap-3 mt-1.5 sm:mt-2 text-xs sm:text-sm text-neutral-500">
                  {business.website && (
                    <a
                      href={business.website.startsWith('http') ? business.website : `https://${business.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-orange-500 transition-colors"
                    >
                      <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="truncate max-w-[150px]">{business.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                  {business.founding_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      Founded {new Date(business.founding_date).getFullYear()}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="border-neutral-700 text-white hover:bg-neutral-800 shrink-0 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
              >
                <Pencil className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SponsorContent() {
  const router = useRouter();
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
  const walletAddress = embeddedWallet?.address;

  const {
    business,
    applications,
    isLoading: isLoadingBusiness,
    isLoadingApplications,
    isRegistered,
    refetch,
    refetchApplications,
  } = useBusiness(walletAddress);

  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Card className="p-8 bg-neutral-900/50 border-neutral-800 text-center max-w-md">
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Sponsor a Project</h1>
          <p className="text-neutral-400 mb-6">
            Submit your infrastructure project to receive funding from global investors. Login to get started.
          </p>
          <Button onClick={login} className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25">
            Login to Submit Project
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoadingBusiness) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <div className="container mx-auto px-4 py-8">
          <BusinessRegistrationForm
            walletAddress={walletAddress!}
            onRegistered={() => refetch()}
          />
        </div>
      </div>
    );
  }

  // Show project form
  if (showProjectForm) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="outline"
            onClick={() => setShowProjectForm(false)}
            className="mb-6 border-neutral-700 text-white hover:bg-neutral-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          <ProjectForm walletAddress={walletAddress!} />
        </div>
      </div>
    );
  }

  // Show edit form
  if (showEditForm) {
    const { BusinessEditForm } = require('@/components/sponsor');
    return (
      <div className="min-h-screen bg-neutral-950">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="outline"
            onClick={() => setShowEditForm(false)}
            className="mb-6 border-neutral-700 text-white hover:bg-neutral-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
          <div className="max-w-xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-6">Edit Business Profile</h1>
            <BusinessEditForm
              business={business!}
              walletAddress={walletAddress!}
            />
          </div>
        </div>
      </div>
    );
  }

  // Main view - business profile with applications
  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Business Profile Header */}
        <BusinessProfile
          business={business!}
          walletAddress={walletAddress!}
          onEdit={() => setShowEditForm(true)}
        />

        {/* Applications Section */}
        <div className="mt-6 lg:mt-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-white">Project Applications</h2>
            <Button
              onClick={() => setShowProjectForm(true)}
              className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25 text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Submit New Project
            </Button>
          </div>

          {isLoadingApplications ? (
            <div className="flex justify-center py-8 sm:py-12">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 animate-spin" />
            </div>
          ) : applications.length === 0 ? (
            <Card className="p-8 sm:p-12 bg-neutral-900/50 border-neutral-800 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-600" />
              </div>
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-1.5 sm:mb-2">No Projects Yet</h3>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
                You haven't submitted any project applications yet.
              </p>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {applications.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SponsorPage() {
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

  return <SponsorContent />;
}
