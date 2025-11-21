'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { ModalFooter } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { Testimonial } from '@/types/database';

interface TestimonialFormData {
  name: string;
  email: string;
  company?: string;
  position?: string;
  content: string;
  rating: number;
  image_url?: string;
  is_approved: boolean;
  is_featured: boolean;
}

interface TestimonialFormProps {
  testimonial?: Testimonial | null;
  onSave: () => void;
  onCancel: () => void;
}

export function TestimonialForm({ testimonial, onSave, onCancel }: TestimonialFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<TestimonialFormData>({
    defaultValues: {
      name: testimonial?.name || '',
      email: testimonial?.email || '',
      company: testimonial?.company || '',
      position: testimonial?.position || '',
      content: testimonial?.content || '',
      rating: testimonial?.rating || 5,
      image_url: testimonial?.image_url || '',
      is_approved: testimonial?.is_approved ?? false,
      is_featured: testimonial?.is_featured ?? false,
    },
  });

  const { request: saveRequest, loading: saving } = useApiRequest();
  const rating = watch('rating');
  const imageUrl = watch('image_url');

  const onSubmit = async (data: TestimonialFormData) => {
    try {
      const url = testimonial ? `/api/testimonials/${testimonial.id}` : '/api/testimonials';
      const method = testimonial ? 'PUT' : 'POST';

      await saveRequest(url, {
        method,
        body: data,
      });

      onSave();
    } catch (error) {
      console.error('Error saving testimonial:', error);
    }
  };

  const renderStars = (currentRating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-2xl ${star <= currentRating ? 'text-yellow-400' : 'text-gray-300'} ${interactive ? 'hover:text-yellow-400 cursor-pointer' : ''}`}
            onClick={interactive ? () => setValue('rating', star) : undefined}
            disabled={!interactive}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  const handleImageUpload = (url: string) => {
    setValue('image_url', url);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...register('name', { required: 'Name is required' })}
            readOnly={!!testimonial}
            className={testimonial ? 'bg-gray-50' : ''}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email', { required: 'Email is required' })}
            readOnly={!!testimonial}
            className={testimonial ? 'bg-gray-50' : ''}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company">Company (optional)</Label>
          <Input
            id="company"
            {...register('company')}
            readOnly={!!testimonial}
            className={testimonial ? 'bg-gray-50' : ''}
          />
        </div>

        <div>
          <Label htmlFor="position">Position (optional)</Label>
          <Input
            id="position"
            {...register('position')}
            readOnly={!!testimonial}
            className={testimonial ? 'bg-gray-50' : ''}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="rating">Rating</Label>
        <div className="flex items-center gap-4">
          {renderStars(rating, !testimonial)}
          <span className="text-sm text-gray-600">({rating}/5)</span>
        </div>
        <input
          type="hidden"
          {...register('rating', { required: true, min: 1, max: 5 })}
        />
        {errors.rating && <p className="text-red-500 text-sm">Rating is required</p>}
      </div>

      <div>
        <Label htmlFor="content">Testimonial Content</Label>
        <Textarea
          id="content"
          {...register('content', { required: 'Content is required' })}
          readOnly={!!testimonial}
          className={testimonial ? 'bg-gray-50' : ''}
          rows={6}
        />
        {errors.content && <p className="text-red-500 text-sm">{errors.content.message}</p>}
      </div>

      <div>
        <Label>Profile Image (optional)</Label>
        <ImageUpload
          value={imageUrl}
          onChange={handleImageUpload}
        />
        {imageUrl && (
          <div className="mt-2">
            <img src={imageUrl} alt="Profile" className="w-20 h-20 object-cover rounded-full" />
          </div>
        )}
      </div>

      {testimonial && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Approval & Featured Management</h3>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                id="is_approved"
                type="checkbox"
                {...register('is_approved')}
                className="rounded"
              />
              <Label htmlFor="is_approved">Approve this testimonial</Label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="is_featured"
                type="checkbox"
                {...register('is_featured')}
                className="rounded"
              />
              <Label htmlFor="is_featured">Feature this testimonial</Label>
            </div>
          </div>

          {testimonial.approved_at && (
            <div className="text-sm text-green-600 mt-2">
              Approved on {new Date(testimonial.approved_at).toLocaleString()}
              {testimonial.approved_by && ' by admin'}
            </div>
          )}

          <div className="text-sm text-gray-600 mt-2">
            <p>Approved testimonials will be displayed publicly on the website.</p>
            <p>Featured testimonials will be highlighted and shown prominently.</p>
          </div>
        </div>
      )}

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : (testimonial ? 'Update Testimonial' : 'Create Testimonial')}
        </Button>
      </ModalFooter>
    </form>
  );
}