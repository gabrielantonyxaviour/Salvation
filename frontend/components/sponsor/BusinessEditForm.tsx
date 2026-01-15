'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useBusiness, type Business, type BusinessFormData } from '@/lib/hooks';
import {
  Building2,
  Loader2,
  Globe,
  Calendar,
  FileText,
  Camera,
  ImageIcon,
  Pencil,
  X,
  Check,
} from 'lucide-react';

interface BusinessEditFormProps {
  business: Business;
  walletAddress: string;
  onClose?: () => void;
}

export function BusinessEditForm({ business, walletAddress, onClose }: BusinessEditFormProps) {
  const { update, uploadImage, isUpdating } = useBusiness(walletAddress);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<BusinessFormData>({
    name: business.name,
    website: business.website || '',
    description: business.description || '',
    founding_date: business.founding_date || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPfp, setUploadingPfp] = useState(false);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const pfpInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = async () => {
    if (!validate()) return;

    try {
      await update({
        name: formData.name,
        website: formData.website || undefined,
        description: formData.description || undefined,
        founding_date: formData.founding_date || undefined,
      });
      setIsEditing(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancel = () => {
    setFormData({
      name: business.name,
      website: business.website || '',
      description: business.description || '',
      founding_date: business.founding_date || '',
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleImageUpload = async (file: File, type: 'cover' | 'pfp') => {
    if (type === 'cover') {
      setUploadingCover(true);
    } else {
      setUploadingPfp(true);
    }

    try {
      await uploadImage(file, type);
    } finally {
      if (type === 'cover') {
        setUploadingCover(false);
      } else {
        setUploadingPfp(false);
      }
    }
  };

  return (
    <Card className="bg-neutral-900/50 border-neutral-800 overflow-hidden">
      {/* Cover Image */}
      <div className="relative h-32 bg-neutral-800">
        {business.cover_image_url ? (
          <img
            src={business.cover_image_url}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-neutral-600" />
          </div>
        )}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingCover}
          className="absolute bottom-2 right-2 bg-neutral-900/80 hover:bg-neutral-800 text-white"
        >
          {uploadingCover ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Camera className="w-4 h-4 mr-1" />
              Cover
            </>
          )}
        </Button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'cover')}
          className="hidden"
        />
      </div>

      {/* Profile Image */}
      <div className="relative px-6 -mt-10">
        <div className="relative inline-block">
          <div className="w-20 h-20 rounded-full bg-neutral-800 border-4 border-neutral-900 overflow-hidden">
            {business.pfp_image_url ? (
              <img
                src={business.pfp_image_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-neutral-600" />
              </div>
            )}
          </div>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={() => pfpInputRef.current?.click()}
            disabled={uploadingPfp}
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 border-2 border-neutral-900"
          >
            {uploadingPfp ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Camera className="w-3 h-3" />
            )}
          </Button>
          <input
            ref={pfpInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'pfp')}
            className="hidden"
          />
        </div>
      </div>

      {/* Business Info */}
      <div className="p-6 pt-4">
        {!isEditing ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">{business.name}</h3>
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1 mt-1"
                  >
                    <Globe className="w-3 h-3" />
                    {business.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="border-neutral-700 text-white hover:bg-neutral-800"
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>

            {business.description && (
              <p className="text-neutral-400 text-sm">{business.description}</p>
            )}

            {business.founding_date && (
              <p className="text-neutral-500 text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Founded {new Date(business.founding_date).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-neutral-300 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Business Name *
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
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
                placeholder="Tell us about your business..."
                className="bg-neutral-800 border-neutral-700 text-white mt-1 min-h-[80px]"
              />
            </div>

            <div>
              <Label className="text-neutral-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Founding Date
              </Label>
              <Input
                type="date"
                value={formData.founding_date}
                onChange={(e) => updateField('founding_date', e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white mt-1"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                onClick={handleSave}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                className="border-neutral-700 text-white hover:bg-neutral-800"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
