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
import { useProjectSubmit, type ProjectFormData } from '@/lib/hooks';
import { Check, Loader2, Plus, X, AlertCircle } from 'lucide-react';

const steps = [
  { id: 1, title: 'Business Info', description: 'Organization details' },
  { id: 2, title: 'Project Details', description: 'Project information' },
  { id: 3, title: 'Funding', description: 'Funding goals' },
  { id: 4, title: 'Milestones', description: 'Project milestones' },
  { id: 5, title: 'Review', description: 'Review & submit' },
];

const categories = ['water', 'solar', 'education', 'healthcare', 'agriculture'];
const countries = ['Kenya', 'Nigeria', 'Ghana', 'South Africa', 'Ethiopia', 'Tanzania', 'Uganda', 'Rwanda'];

const initialFormData: ProjectFormData = {
  orgName: '',
  regNumber: '',
  country: '',
  contactEmail: '',
  projectName: '',
  category: '',
  projectCountry: '',
  region: '',
  coordinates: { lat: '', lng: '' },
  description: '',
  imageUrl: '',
  fundingGoal: '',
  bondPrice: '1.00',
  revenueModel: '',
  projectedAPY: '',
  milestones: [
    { description: '', date: '' },
    { description: '', date: '' },
  ],
};

interface ValidationErrors {
  [key: string]: string;
}

export function ProjectForm() {
  const router = useRouter();
  const { submit, isLoading } = useProjectSubmit();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const updateFormData = (field: string, value: string | object) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateCoordinates = (field: 'lat' | 'lng', value: string) => {
    setFormData(prev => ({
      ...prev,
      coordinates: { ...prev.coordinates, [field]: value },
    }));
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
      case 0: // Business Info
        if (!formData.orgName.trim()) newErrors.orgName = 'Organization name is required';
        if (!formData.regNumber.trim()) newErrors.regNumber = 'Registration number is required';
        if (!formData.country) newErrors.country = 'Country is required';
        if (!formData.contactEmail.trim()) {
          newErrors.contactEmail = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
          newErrors.contactEmail = 'Invalid email format';
        }
        break;

      case 1: // Project Details
        if (!formData.projectName.trim()) newErrors.projectName = 'Project name is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.projectCountry) newErrors.projectCountry = 'Project country is required';
        if (!formData.region.trim()) newErrors.region = 'Region is required';
        if (!formData.description.trim()) {
          newErrors.description = 'Description is required';
        } else if (formData.description.length < 50) {
          newErrors.description = 'Description must be at least 50 characters';
        }
        break;

      case 2: // Funding
        if (!formData.fundingGoal || parseFloat(formData.fundingGoal) <= 0) {
          newErrors.fundingGoal = 'Valid funding goal is required';
        }
        if (!formData.revenueModel.trim()) newErrors.revenueModel = 'Revenue model is required';
        if (!formData.projectedAPY || parseFloat(formData.projectedAPY) <= 0 || parseFloat(formData.projectedAPY) > 100) {
          newErrors.projectedAPY = 'APY must be between 0 and 100';
        }
        break;

      case 3: // Milestones
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

    const projectId = await submit(formData);
    if (projectId) {
      router.push(`/projects/${projectId}`);
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

        {/* Step 1: Business Info */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <Label className="text-neutral-300">Organization Name *</Label>
              <Input
                value={formData.orgName}
                onChange={(e) => updateFormData('orgName', e.target.value)}
                placeholder="Kisumu Water Trust"
                className={`bg-neutral-800 border-neutral-700 text-white mt-1 ${errors.orgName ? 'border-red-500' : ''}`}
              />
              {errors.orgName && <p className="text-red-400 text-sm mt-1">{errors.orgName}</p>}
            </div>
            <div>
              <Label className="text-neutral-300">Registration Number *</Label>
              <Input
                value={formData.regNumber}
                onChange={(e) => updateFormData('regNumber', e.target.value)}
                placeholder="REG-12345"
                className={`bg-neutral-800 border-neutral-700 text-white mt-1 ${errors.regNumber ? 'border-red-500' : ''}`}
              />
              {errors.regNumber && <p className="text-red-400 text-sm mt-1">{errors.regNumber}</p>}
            </div>
            <div>
              <Label className="text-neutral-300">Country *</Label>
              <Select value={formData.country} onValueChange={(v) => updateFormData('country', v)}>
                <SelectTrigger className={`bg-neutral-800 border-neutral-700 text-white mt-1 ${errors.country ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-900 border-neutral-800">
                  {countries.map(c => (
                    <SelectItem key={c} value={c} className="text-white hover:bg-neutral-800">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && <p className="text-red-400 text-sm mt-1">{errors.country}</p>}
            </div>
            <div>
              <Label className="text-neutral-300">Contact Email *</Label>
              <Input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => updateFormData('contactEmail', e.target.value)}
                placeholder="contact@organization.org"
                className={`bg-neutral-800 border-neutral-700 text-white mt-1 ${errors.contactEmail ? 'border-red-500' : ''}`}
              />
              {errors.contactEmail && <p className="text-red-400 text-sm mt-1">{errors.contactEmail}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Project Details */}
        {currentStep === 1 && (
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
                <Select value={formData.projectCountry} onValueChange={(v) => updateFormData('projectCountry', v)}>
                  <SelectTrigger className={`bg-neutral-800 border-neutral-700 text-white mt-1 ${errors.projectCountry ? 'border-red-500' : ''}`}>
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
                  value={formData.coordinates.lat}
                  onChange={(e) => updateCoordinates('lat', e.target.value)}
                  placeholder="-0.0917"
                  className="bg-neutral-800 border-neutral-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-neutral-300">Longitude (optional)</Label>
                <Input
                  value={formData.coordinates.lng}
                  onChange={(e) => updateCoordinates('lng', e.target.value)}
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

        {/* Step 3: Funding */}
        {currentStep === 2 && (
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

        {/* Step 4: Milestones */}
        {currentStep === 3 && (
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

        {/* Step 5: Review */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-orange-400 uppercase tracking-wider">Organization</h3>
                <div>
                  <p className="text-neutral-400 text-sm">Name</p>
                  <p className="text-white">{formData.orgName || '-'}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Registration</p>
                  <p className="text-white">{formData.regNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Country</p>
                  <p className="text-white">{formData.country || '-'}</p>
                </div>
                <div>
                  <p className="text-neutral-400 text-sm">Email</p>
                  <p className="text-white">{formData.contactEmail || '-'}</p>
                </div>
              </div>

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
                  <p className="text-white">{formData.region}, {formData.projectCountry}</p>
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

              <div className="space-y-4">
                <h3 className="text-sm font-medium text-orange-400 uppercase tracking-wider">Milestones</h3>
                <div>
                  <p className="text-neutral-400 text-sm">Total Milestones</p>
                  <p className="text-white">{formData.milestones.filter(m => m.description).length}</p>
                </div>
                <ul className="space-y-1">
                  {formData.milestones.filter(m => m.description).map((m, i) => (
                    <li key={i} className="text-sm text-neutral-300">
                      {i + 1}. {m.description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-sm text-orange-400">
                By submitting this project, you confirm that all information provided is accurate and you have the authority to represent the organization.
              </p>
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
              className="bg-orange-500 hover:bg-orange-600"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Project'
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
