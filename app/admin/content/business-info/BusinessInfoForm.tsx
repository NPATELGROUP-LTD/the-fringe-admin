'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { ModalFooter } from '@/components/ui/Modal';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { BusinessInfo } from '@/types/database';

interface BusinessInfoFormData {
  key: string;
  value: any;
  type: 'text' | 'email' | 'phone' | 'address' | 'hours' | 'social';
  is_active: boolean;
}

interface BusinessInfoFormProps {
  businessInfo?: BusinessInfo | null;
  onSave: () => void;
  onCancel: () => void;
}

interface HoursData {
  monday?: { open: string; close: string; closed: boolean };
  tuesday?: { open: string; close: string; closed: boolean };
  wednesday?: { open: string; close: string; closed: boolean };
  thursday?: { open: string; close: string; closed: boolean };
  friday?: { open: string; close: string; closed: boolean };
  saturday?: { open: string; close: string; closed: boolean };
  sunday?: { open: string; close: string; closed: boolean };
}

interface SocialData {
  platform: string;
  url: string;
  username?: string;
}

export function BusinessInfoForm({ businessInfo, onSave, onCancel }: BusinessInfoFormProps) {
  const [selectedType, setSelectedType] = useState<'text' | 'email' | 'phone' | 'address' | 'hours' | 'social'>(
    businessInfo?.type || 'text'
  );
  const [hoursData, setHoursData] = useState<HoursData>({});
  const [socialData, setSocialData] = useState<SocialData>({ platform: '', url: '', username: '' });

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<BusinessInfoFormData>({
    defaultValues: {
      key: businessInfo?.key || '',
      value: businessInfo?.value || '',
      type: businessInfo?.type || 'text',
      is_active: businessInfo?.is_active ?? true,
    },
  });

  const { request: saveRequest, loading: saving } = useApiRequest();

  useEffect(() => {
    if (businessInfo) {
      setSelectedType(businessInfo.type);
      if (businessInfo.type === 'hours' && typeof businessInfo.value === 'object') {
        setHoursData(businessInfo.value as HoursData);
      } else if (businessInfo.type === 'social' && typeof businessInfo.value === 'object') {
        setSocialData(businessInfo.value as SocialData);
      }
    }
  }, [businessInfo]);

  const onSubmit = async (data: BusinessInfoFormData) => {
    try {
      let finalValue = data.value;

      // Handle special types
      if (selectedType === 'hours') {
        finalValue = hoursData;
      } else if (selectedType === 'social') {
        finalValue = socialData;
      }

      const payload = {
        ...data,
        type: selectedType,
        value: finalValue,
      };

      const url = businessInfo ? `/api/business-info/${businessInfo.id}` : '/api/business-info';
      const method = businessInfo ? 'PUT' : 'POST';

      await saveRequest(url, {
        method,
        body: payload,
      });

      onSave();
    } catch (error) {
      console.error('Error saving business info:', error);
    }
  };

  const handleTypeChange = (newType: string) => {
    const type = newType as BusinessInfoFormData['type'];
    setSelectedType(type);
    setValue('type', type);

    // Reset value when type changes
    if (type === 'hours') {
      setHoursData({});
    } else if (type === 'social') {
      setSocialData({ platform: '', url: '', username: '' });
    } else {
      setValue('value', '');
    }
  };

  const updateHours = (day: string, field: string, value: string | boolean) => {
    setHoursData(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof HoursData],
        [field]: value,
      },
    }));
  };

  const updateSocial = (field: keyof SocialData, value: string) => {
    setSocialData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderValueInput = () => {
    switch (selectedType) {
      case 'text':
        return (
          <div>
            <Label htmlFor="value">Text Value *</Label>
            <Textarea
              id="value"
              {...register('value', { required: 'Value is required' })}
              placeholder="Enter text content"
              rows={3}
            />
            {errors.value && <p className="text-red-500 text-sm">{errors.value.message}</p>}
          </div>
        );

      case 'email':
        return (
          <div>
            <Label htmlFor="value">Email Address *</Label>
            <Input
              id="value"
              type="email"
              {...register('value', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Invalid email format'
                }
              })}
              placeholder="contact@example.com"
            />
            {errors.value && <p className="text-red-500 text-sm">{String(errors.value.message)}</p>}
          </div>
        );

      case 'phone':
        return (
          <div>
            <Label htmlFor="value">Phone Number *</Label>
            <Input
              id="value"
              {...register('value', { required: 'Phone number is required' })}
              placeholder="+1 (555) 123-4567"
            />
            {errors.value && <p className="text-red-500 text-sm">{String(errors.value.message)}</p>}
          </div>
        );

      case 'address':
        return (
          <div>
            <Label htmlFor="value">Address *</Label>
            <Textarea
              id="value"
              {...register('value', { required: 'Address is required' })}
              placeholder="123 Main St, City, State 12345"
              rows={3}
            />
            {errors.value && <p className="text-red-500 text-sm">{String(errors.value.message)}</p>}
          </div>
        );

      case 'hours':
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        return (
          <div>
            <Label>Operating Hours</Label>
            <div className="space-y-3 mt-2">
              {days.map(day => {
                const dayData = hoursData[day as keyof HoursData] || { open: '09:00', close: '17:00', closed: false };
                return (
                  <div key={day} className="flex items-center gap-3">
                    <div className="w-20 capitalize">{day}</div>
                    <input
                      type="checkbox"
                      checked={dayData.closed || false}
                      onChange={(e) => updateHours(day, 'closed', e.target.checked)}
                      className="mr-2"
                    />
                    <Label className="mr-2">Closed</Label>
                    {!dayData.closed && (
                      <>
                        <Input
                          type="time"
                          value={dayData.open || '09:00'}
                          onChange={(e) => updateHours(day, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={dayData.close || '17:00'}
                          onChange={(e) => updateHours(day, 'close', e.target.value)}
                          className="w-32"
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'social':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform">Platform *</Label>
              <Select
                id="platform"
                value={socialData.platform}
                onChange={(e) => updateSocial('platform', e.target.value)}
              >
                <option value="">Select Platform</option>
                <option value="facebook">Facebook</option>
                <option value="twitter">Twitter</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="other">Other</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                value={socialData.url}
                onChange={(e) => updateSocial('url', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="username">Username (optional)</Label>
              <Input
                id="username"
                value={socialData.username || ''}
                onChange={(e) => updateSocial('username', e.target.value)}
                placeholder="@username"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="key">Key *</Label>
        <Input
          id="key"
          {...register('key', { required: 'Key is required' })}
          placeholder="e.g., contact_email, business_address"
        />
        {errors.key && <p className="text-red-500 text-sm">{errors.key.message}</p>}
      </div>

      <div>
        <Label htmlFor="type">Type *</Label>
        <Select
          id="type"
          value={selectedType}
          onChange={(e) => handleTypeChange(e.target.value)}
        >
          <option value="text">Text</option>
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="address">Address</option>
          <option value="hours">Hours</option>
          <option value="social">Social Media</option>
        </Select>
      </div>

      {renderValueInput()}

      <div className="flex items-center space-x-2">
        <input
          id="is_active"
          type="checkbox"
          {...register('is_active')}
          className="rounded"
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : (businessInfo ? 'Update Business Info' : 'Create Business Info')}
        </Button>
      </ModalFooter>
    </form>
  );
}