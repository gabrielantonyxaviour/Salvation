'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProjectForm } from '@/components/sponsor';
import { Building2, Loader2 } from 'lucide-react';

function SponsorContent() {
  const { authenticated, login } = usePrivy();

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
          <Button onClick={login} className="bg-orange-500 hover:bg-orange-600">
            Login to Submit Project
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Submit a Project</h1>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Get your infrastructure project funded by global investors. Complete the form below to register your project on the Salvation platform.
          </p>
        </div>

        <ProjectForm />
      </div>
    </div>
  );
}

export default function SponsorPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render on client side to avoid SSG issues with providers
  if (!isClient) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return <SponsorContent />;
}
