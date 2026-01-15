'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjectReview } from '@/lib/hooks';
import { Check, Loader2, Plus, X, AlertCircle, Bot } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectFormProps {
  walletAddress: string;
}

const steps = [
  { id: 1, title: 'Project Details', description: 'Project information' },
  { id: 2, title: 'Funding', description: 'Funding goals' },
  { id: 3, title: 'Milestones', description: 'Project milestones' },
  { id: 4, title: 'Review', description: 'Review & submit for review' },
];

const categories = ['water', 'solar', 'education', 'healthcare', 'agriculture'];
const countries = ['Kenya', 'Nigeria', 'Ghana', 'South Africa', 'Ethiopia', 'Tanzania', 'Uganda', 'Rwanda'];

interface FormData {
  projectName: string;
  category: string;
  country: string;
  region: string;
  latitude: string;
  longitude: string;
  description: string;
  imageUrl: string;
  fundingGoal: string;
  bondPrice: string;
  revenueModel: string;
  projectedAPY: string;
  milestones: { description: string; date: string }[];
}

const initialFormData: FormData = {
  projectName: 'Kisumu Community Solar Farm',
  category: 'solar',
  country: 'Kenya',
  region: 'Kisumu',
  latitude: '-0.0917',
  longitude: '34.7680',
  description: 'A community-owned solar farm project that will provide clean, renewable energy to over 500 households in the Kisumu region. The project includes installation of 200kW solar panels, battery storage systems, and a local distribution network. Revenue will be generated through monthly electricity subscriptions from connected households.',
  imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',
  fundingGoal: '25000',
  bondPrice: '1.00',
  revenueModel: 'Monthly electricity subscription fees from 500+ connected households at $5-10/month per household, generating $2,500-5,000 monthly revenue. Additional income from excess power sold to the national grid during peak production periods.',
  projectedAPY: '12',
  milestones: [
    { description: 'Site preparation and permits secured', date: '2025-03-01' },
    { description: 'Solar panel installation complete', date: '2025-06-15' },
    { description: 'Grid connection and first households connected', date: '2025-08-01' },
    { description: 'Full operational capacity - 500 households', date: '2025-10-01' },
  ],
};

interface ValidationErrors {
  [key: string]: string;
}

export function ProjectForm({ walletAddress }: ProjectFormProps) {
  const router = useRouter();
  const { submit, isSubmitting } = useProjectReview();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { description: '', date: '' }],
    }));
  };

  const removeMilestone = (index: number) => {
    if (formData.milestones.length <= 2) return;
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index),
    }));
  };

  const updateMilestone = (index: number, field: 'description' | 'date', value: string) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((m, i) =>
        i === index ? { ...m, [field]: value } : m
      ),
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    switch (step) {
      case 0: // Project Details
        if (!formData.projectName.trim()) newErrors.projectName = 'Project name is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.country) newErrors.country = 'Country is required';
        if (!formData.region.trim()) newErrors.region = 'Region is required';
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        } else if (formData.description.length < 50) {
          newErrors.description = 'Description must be at least 50 characters';
        }
        break;

      case 1: // Funding
        if (!formData.fundingGoal || parseFloat(formData.fundingGoal) <= 0) {
          newErrors.fundingGoal = 'Valid funding goal is required';
        }
        if (!formData.revenueModel.trim()) newErrors.revenueModel = 'Revenue model is required';
        if (!formData.projectedAPY || parseFloat(formData.projectedAPY) <= 0 || parseFloat(formData.projectedAPY) > 100) {
          newErrors.projectedAPY = 'APY must be between 0 and 100';
        }
        break;

      case 2: // Milestones
        const validMilestones = formData.milestones.filter(m => m.description.trim() && m.date);
        if (validMilestones.length < 2) {
          newErrors.milestones = 'At least 2 complete milestones are required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      const application = await submit({
        wallet_address: walletAddress,
        project_name: formData.projectName,
        description: formData.description,
        category: formData.category,
        image_url: formData.imageUrl || null,
        country: formData.country,
        region: formData.region,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        funding_goal: parseFloat(formData.fundingGoal),
        bond_price: parseFloat(formData.bondPrice),
        revenue_model: formData.revenueModel,
        projected_apy: parseFloat(formData.projectedAPY),
        milestones: formData.milestones
          .filter(m => m.description.trim() && m.date)
          .map(m => ({
            description: m.description,
            target_date: m.date,
          })),
      });

      if (application) {
        router.push(`/review/${application.id}`);
      }
    } catch (error) {
      toast.error('Failed to submit application');
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-200
                  ${index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                    ? 'bg-orange-500 text-white ring-4 ring-orange-500/30'
                    : 'bg-neutral-800 text-neutral-400'
                  }
                `}
              >
                {index < currentStep ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <span className={`mt-2 text-xs hidden md:block ${
                index === currentStep ? 'text-orange-400' : 'text-neutral-600'
              }`}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 md:w-20 h-1 mx-2 transition-all duration-200 ${
                index < currentStep ? 'bg-green-500' : 'bg-neutral-800'
              }`} />
            )}
          </div>
        ))}
      </div>

      <Card className="p-6 bg-neutral-900/50 border-neutral-800">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">{steps[currentStep].title}</h2>
          <p className="text-sm text-neutral-400">{steps[currentStep].description}</p>
        </div>

        {/* Step 1: Project Details */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <Label className="text-neutral-300">Project Name *</Label>
              <Input
                value={formData.projectName}
                onChange={(e) => updateFormData('projectName', e.target.value)}
                placeholder="Community Water Well"
                className={`bg-neutral-800 border-neutral-700 text-white mt-1 ${errors.projectName ? 'border-red-500' : ''}`}
              />
              {errors.projectName && <p className="text-red-400 text-sm mt-1">{errors.projectName}</p>}
            </div>
            <div>
              <Label className="text-neutral-300">Category *</Label>
              <Select value={formData.category} onValueChange={(v) => updateFormData('category', v)}>
                <SelectTrigger className={`bg-neutral-800 border-neutral-700 text-white mt-1 ${errors.category ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  {categories.map(c => (
                    <SelectItem key={c} value={c} className="text-white hover:bg-neutral-800 capitalize">
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-neutral-300">Country *</Label>
                <Select value={formData.country} onValueChange={(v) => updateFormData('country', v)}>
                  <SelectTrigger className={`bg-neutral-800 border-neutral-700 text-white mt-1 ${errors.country ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-900 border-neutral-800">
                    {countries.map(c => (
                      <SelectItem key={c} value={c} className="text-white hover:bg-neutral-800">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-neutral-300">Region *</Label>
                <Input
                  value={formData.region}
                  onChange={(e) => updateFormData('region', e.target.value)}
                  placeholder="Kisumu"
                  className={`bg-neutral-800 border-neutral-700 text-white mt-1 ${errors.region ? 'border-red-500' : ''}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-neutral-300">Latitude (optional)</Label>
                <Input
                  value={formData.latitude}
                  onChange={(e) => updateFormData('latitude', e.target.value)}
                  placeholder="-0.0917"
                  className="bg-neutral-800 border-neutral-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-neutral-300">Longitude (optional)</Label>
                <Input
                  value={formData.longitude}
                  onChange={(e) => updateFormData('longitude', e.target.value)}
                  placeholder="34.7680"
                  className="bg-neutral-800 border-neutral-700 text-white mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-neutral-300">Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="Describe your project in detail (minimum 50 characters)..."
                className={`bg-neutral-800 border-neutral-700 text-white mt-1 min-h-[120px] ${errors.description ? 'border-red-500' : ''}`}
              />
              <p className="text-xs text-neutral-600 mt-1">{formData.description.length}/50 characters minimum</p>
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>
            <div>
              <Label className="text-neutral-300">Image URL (optional)</Label>
              <Input
                value={formData.imageUrl}
                onChange={(e) => updateFormData('imageUrl', e.target.value)}
                placeholder="https://..."
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
              />
            </div>
          </div>
        )}

        {/* Step 2: Funding */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-neutral-300">Funding Goal (USDC) *</Label>
              <Input
                type="number"
                value={formData.fundingGoal}
                onChange={(e) => updateFormData('fundingGoal', e.target.value)}
                placeholder="10000"
                min="0"
                className={`bg-neutral-800 border-neutral-700 text-white mt-1 ${errors.fundingGoal ? 'border-red-500' : ''}`}
              />
              {errors.fundingGoal && <p className="text-red-400 text-sm mt-1">{errors.fundingGoal}</p>}
            </div>
            <div>
              <Label className="text-neutral-300">Bond Price (USDC)</Label>
              <Input
                value="$1.00"
                disabled
                className="bg-neutral-800 border-neutral-700 text-neutral-400 mt-1"
              />
              <p className="text-xs text-neutral-600 mt-1">Bond price is fixed at $1.00 USDC</p>
            </div>
            <div>
              <Label className="text-neutral-300">Revenue Model *</Label>
              <Textarea
                value={formData.revenueModel}
                onChange={(e) => updateFormData('revenueModel', e.target.value)}
                placeholder="Describe how this project will generate revenue to pay yield to bondholders..."
                className={`bg-neutral-800 border-neutral-700 text-white mt-1 min-h-[100px] ${errors.revenueModel ? 'border-red-500' : ''}`}
              />
              {errors.revenueModel && <p className="text-red-400 text-sm mt-1">{errors.revenueModel}</p>}
            </div>
            <div>
              <Label className="text-neutral-300">Projected APY (%) *</Label>
              <Input
                type="number"
                value={formData.projectedAPY}
                onChange={(e) => updateFormData('projectedAPY', e.target.value)}
                placeholder="12"
                min="0"
                max="100"
                className={`bg-neutral-800 border-neutral-700 text-white mt-1 ${errors.projectedAPY ? 'border-red-500' : ''}`}
              />
              {errors.projectedAPY && <p className="text-red-400 text-sm mt-1">{errors.projectedAPY}</p>}
            </div>
          </div>
        )}

        {/* Step 3: Milestones */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-neutral-400 text-sm">Add at least 2 milestones for your project.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMilestone}
                className="border-neutral-700 text-white hover:bg-neutral-800"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Milestone
              </Button>
            </div>

            {errors.milestones && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-red-400 text-sm">{errors.milestones}</p>
              </div>
            )}

            {formData.milestones.map((milestone, index) => (
              <div key={index} className="flex gap-3 items-start p-4 bg-neutral-800/30 rounded-lg">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-xs font-medium text-white">
                  {index + 1}
                </span>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    value={milestone.description}
                    onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                    placeholder={`Milestone ${index + 1} description`}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                  <Input
                    type="date"
                    value={milestone.date}
                    onChange={(e) => updateMilestone(index, 'date', e.target.value)}
                    className="bg-neutral-800 border-neutral-700 text-white"
                  />
                </div>
                {formData.milestones.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMilestone(index)}
                    className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-orange-400 uppercase tracking-wider">Project</h3>
                <div>
                  <p className="text-neutral-400 text-sm">Name</p>
                  <p className="text-white">{formData.projectName || '-'}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Category</p>
                  <p className="text-white capitalize">{formData.category || '-'}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Location</p>
                  <p className="text-white">{formData.region}, {formData.country}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-orange-400 uppercase tracking-wider">Funding</h3>
                <div>
                  <p className="text-neutral-400 text-sm">Goal</p>
                  <p className="text-white">${parseFloat(formData.fundingGoal || '0').toLocaleString()} USDC</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Bond Price</p>
                  <p className="text-white">$1.00 USDC</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Projected APY</p>
                  <p className="text-white">{formData.projectedAPY || '0'}%</p>
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <h3 className="text-sm font-medium text-orange-400 uppercase tracking-wider">Milestones</h3>
                <ul className="space-y-1">
                  {formData.milestones.filter(m => m.description).map((m, i) => (
                    <li key={i} className="text-sm text-neutral-300">
                      {i + 1}. {m.description} - {m.date ? new Date(m.date).toLocaleDateString() : 'No date'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Bot className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm text-orange-400 font-medium">Agent Review Process</p>
                  <p className="text-sm text-neutral-300 mt-1">
                    After submission, our AI Oracle will review your application. You'll have a conversation with the agent to discuss and refine your project details before final approval.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-neutral-800">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="border-neutral-700 text-white hover:bg-neutral-800"
          >
            Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/25"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Submit for Review
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
