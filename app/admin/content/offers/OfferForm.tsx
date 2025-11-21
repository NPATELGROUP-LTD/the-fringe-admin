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
import type { Offer } from '@/types/database';

interface OfferFormData {
  title: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  is_active: boolean;
}

interface OfferFormProps {
  offer?: Offer | null;
  onSave: () => void;
  onCancel: () => void;
}

export function OfferForm({ offer, onSave, onCancel }: OfferFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<OfferFormData>({
    defaultValues: {
      title: offer?.title || '',
      description: offer?.description || '',
      discount_type: offer?.discount_type || 'percentage',
      discount_value: offer?.discount_value || 0,
      valid_from: offer?.valid_from ? new Date(offer.valid_from).toISOString().split('T')[0] : '',
      valid_until: offer?.valid_until ? new Date(offer.valid_until).toISOString().split('T')[0] : '',
      usage_limit: offer?.usage_limit || undefined,
      is_active: offer?.is_active ?? true,
    },
  });

  const { request: saveRequest, loading: saving } = useApiRequest();

  const discountType = watch('discount_type');

  const onSubmit = async (data: OfferFormData) => {
    try {
      // Convert empty string to undefined for usage_limit
      if (data.usage_limit === 0 || data.usage_limit === undefined) {
        data.usage_limit = undefined;
      }

      const url = offer ? `/api/offers/${offer.id}` : '/api/offers';
      const method = offer ? 'PUT' : 'POST';

      await saveRequest(url, {
        method,
        body: data,
      });

      onSave();
    } catch (error) {
      console.error('Error saving offer:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          {...register('title', { required: 'Title is required' })}
          placeholder="Offer title"
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register('description', { required: 'Description is required' })}
          placeholder="Offer description"
          rows={3}
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="discount_type">Discount Type *</Label>
          <Select id="discount_type" {...register('discount_type', { required: 'Discount type is required' })}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
          </Select>
          {errors.discount_type && <p className="text-red-500 text-sm">{errors.discount_type.message}</p>}
        </div>

        <div>
          <Label htmlFor="discount_value">
            Discount Value * {discountType === 'percentage' ? '(%)' : '($)'}
          </Label>
          <Input
            id="discount_value"
            type="number"
            step={discountType === 'percentage' ? '0.01' : '0.01'}
            min="0"
            max={discountType === 'percentage' ? '100' : undefined}
            {...register('discount_value', {
              required: 'Discount value is required',
              min: { value: 0, message: 'Discount value must be greater than 0' },
              max: discountType === 'percentage' ? { value: 100, message: 'Percentage cannot exceed 100%' } : undefined,
            })}
            placeholder={discountType === 'percentage' ? '10.00' : '50.00'}
          />
          {errors.discount_value && <p className="text-red-500 text-sm">{errors.discount_value.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="valid_from">Valid From *</Label>
          <Input
            id="valid_from"
            type="date"
            {...register('valid_from', { required: 'Valid from date is required' })}
          />
          {errors.valid_from && <p className="text-red-500 text-sm">{errors.valid_from.message}</p>}
        </div>

        <div>
          <Label htmlFor="valid_until">Valid Until *</Label>
          <Input
            id="valid_until"
            type="date"
            {...register('valid_until', { required: 'Valid until date is required' })}
          />
          {errors.valid_until && <p className="text-red-500 text-sm">{errors.valid_until.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="usage_limit">Usage Limit (optional)</Label>
        <Input
          id="usage_limit"
          type="number"
          min="1"
          {...register('usage_limit', {
            min: { value: 1, message: 'Usage limit must be at least 1' },
            setValueAs: (value) => value === '' ? undefined : parseInt(value),
          })}
          placeholder="Leave empty for unlimited"
        />
        {errors.usage_limit && <p className="text-red-500 text-sm">{errors.usage_limit.message}</p>}
        <p className="text-sm text-gray-600 mt-1">Leave empty for unlimited usage</p>
      </div>

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
          {saving ? 'Saving...' : (offer ? 'Update Offer' : 'Create Offer')}
        </Button>
      </ModalFooter>
    </form>
  );
}