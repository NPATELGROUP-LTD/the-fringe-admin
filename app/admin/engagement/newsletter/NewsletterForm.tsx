'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { ModalFooter } from '@/components/ui/Modal';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { NewsletterSubscription } from '@/types/database';

interface NewsletterFormData {
  email: string;
  first_name?: string;
  last_name?: string;
  status: 'subscribed' | 'unsubscribed' | 'pending';
  interests: string;
}

interface NewsletterFormProps {
  subscription?: NewsletterSubscription | null;
  onSave: () => void;
  onCancel: () => void;
}

export function NewsletterForm({ subscription, onSave, onCancel }: NewsletterFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<NewsletterFormData>({
    defaultValues: {
      email: subscription?.email || '',
      first_name: subscription?.first_name || '',
      last_name: subscription?.last_name || '',
      status: subscription?.status || 'pending',
      interests: subscription?.interests?.join(', ') || '',
    },
  });

  const { request: saveRequest, loading: saving } = useApiRequest();

  const onSubmit = async (data: NewsletterFormData) => {
    try {
      const url = subscription ? `/api/newsletter/${subscription.id}` : '/api/newsletter';
      const method = subscription ? 'PUT' : 'POST';

      // Convert interests string to array
      const interestsArray = data.interests
        ? data.interests.split(',').map(i => i.trim()).filter(i => i.length > 0)
        : null;

      // For updates, only send the fields that can be modified
      const updateData = subscription ? {
        first_name: data.first_name || null,
        last_name: data.last_name || null,
        status: data.status,
        interests: interestsArray,
      } : {
        ...data,
        interests: interestsArray,
      };

      await saveRequest(url, {
        method,
        body: updateData,
      });

      onSave();
    } catch (error) {
      console.error('Error saving newsletter subscription:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          {...register('email', { required: 'Email is required' })}
          readOnly={!!subscription}
          className={subscription ? 'bg-gray-50' : ''}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            {...register('first_name')}
          />
        </div>

        <div>
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            {...register('last_name')}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="status">Status *</Label>
        <Select
          id="status"
          {...register('status', { required: 'Status is required' })}
        >
          <option value="pending">Pending</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
        </Select>
        {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
      </div>

      <div>
        <Label htmlFor="interests">Interests (comma-separated)</Label>
        <Input
          id="interests"
          {...register('interests')}
          placeholder="e.g., technology, marketing, design"
        />
        <p className="text-sm text-gray-600 mt-1">
          Enter interests separated by commas
        </p>
      </div>

      {subscription && (
        <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
          <div>Subscribed: {new Date(subscription.subscribed_at).toLocaleString()}</div>
          {subscription.unsubscribed_at && (
            <div>Unsubscribed: {new Date(subscription.unsubscribed_at).toLocaleString()}</div>
          )}
          <div>Created: {new Date(subscription.created_at).toLocaleString()}</div>
          <div>Updated: {new Date(subscription.updated_at).toLocaleString()}</div>
        </div>
      )}

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : (subscription ? 'Update Subscription' : 'Create Subscription')}
        </Button>
      </ModalFooter>
    </form>
  );
}