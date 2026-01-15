'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useBusiness, type BusinessFormData } from '@/lib/hooks';
import { Building2, Loader2, Globe, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BusinessRegistrationFormProps {
  walletAddress: string;
  onRegistered: () => void;
}

export function BusinessRegistrationForm({ walletAddress, onRegistered }: BusinessRegistrationFormProps) {
  const { register, isRegistering } = useBusiness(walletAddress);
  const [formData, setFormData] = useState<BusinessFormData>({
    name: 'GreenTech Infrastructure Ltd',
    website: 'https://greentech-infra.com',
    description: 'A leading infrastructure development company specializing in sustainable water and solar energy solutions across East Africa. We have successfully completed over 50 community projects.',
    founding_date: '2018-03-15',
  });
  const [foundingDate, setFoundingDate] = useState<Date | undefined>(new Date('2018-03-15'));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof BusinessFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must be a valid URL (https://...)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      await register({
        name: formData.name,
        website: formData.website || undefined,
        description: formData.description || undefined,
        founding_date: formData.founding_date || undefined,
      });
      onRegistered();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <Card className="p-6 bg-neutral-900/50 border-neutral-800 max-w-xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-orange-500" />
        </div>
        <h2 className="text-xl font-semibold text-white">Register Your Business</h2>
        <p className="text-sm text-neutral-400 mt-2">
          Before submitting projects, please register your business details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label className="text-neutral-300 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Business Name *
          </Label>
          <Input
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Acme Infrastructure Ltd"
            className={`bg-neutral-800 border-neutral-700 text-white mt-1 ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label className="text-neutral-300 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Website
          </Label>
          <Input
            value={formData.website}
            onChange={(e) => updateField('website', e.target.value)}
            placeholder="https://example.com"
            className={`bg-neutral-800 border-neutral-700 text-white mt-1 ${errors.website ? 'border-red-500' : ''}`}
          />
          {errors.website && <p className="text-red-400 text-sm mt-1">{errors.website}</p>}
        </div>

        <div>
          <Label className="text-neutral-300 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Description
          </Label>
          <Textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Tell us about your business and what you do..."
            className="bg-neutral-800 border-neutral-700 text-white mt-1 min-h-[100px]"
          />
        </div>

        <div>
          <Label className="text-neutral-300 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Founding Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal mt-1 bg-neutral-800 border-neutral-700 text-white hover:bg-neutral-700",
                  !foundingDate && "text-neutral-400"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {foundingDate ? format(foundingDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-neutral-900 border-neutral-700" align="start">
              <Calendar
                mode="single"
                selected={foundingDate}
                onSelect={(date) => {
                  setFoundingDate(date);
                  if (date) {
                    updateField('founding_date', format(date, 'yyyy-MM-dd'));
                  }
                }}
                initialFocus
                className="bg-neutral-900 text-white"
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button
          type="submit"
          disabled={isRegistering}
          className="w-full bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25 mt-6"
        >
          {isRegistering ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Registering...
            </>
          ) : (
            'Register Business'
          )}
        </Button>
      </form>
    </Card>
  );
}
