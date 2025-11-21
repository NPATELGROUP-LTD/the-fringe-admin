'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { ModalFooter } from '@/components/ui/Modal';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { Review } from '@/types/database';

interface ReviewFormData {
  course_id?: string;
  name: string;
  email: string;
  rating: number;
  title: string;
  content: string;
  is_approved: boolean;
  response?: string;
}

interface ReviewFormProps {
  review?: Review | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ReviewForm({ review, onSave, onCancel }: ReviewFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ReviewFormData>({
    defaultValues: {
      course_id: review?.course_id || '',
      name: review?.name || '',
      email: review?.email || '',
      rating: review?.rating || 5,
      title: review?.title || '',
      content: review?.content || '',
      is_approved: review?.is_approved ?? false,
      response: review?.response || '',
    },
  });

  const { request: saveRequest, loading: saving } = useApiRequest();
  const rating = watch('rating');

  const onSubmit = async (data: ReviewFormData) => {
    try {
      const url = review ? `/api/reviews/${review.id}` : '/api/reviews';
      const method = review ? 'PUT' : 'POST';

      await saveRequest(url, {
        method,
        body: data,
      });

      onSave();
    } catch (error) {
      console.error('Error saving review:', error);
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...register('name', { required: 'Name is required' })}
            readOnly={!!review}
            className={review ? 'bg-gray-50' : ''}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email', { required: 'Email is required' })}
            readOnly={!!review}
            className={review ? 'bg-gray-50' : ''}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="course_id">Course ID (optional)</Label>
          <Input
            id="course_id"
            {...register('course_id')}
            placeholder="Leave empty if not course-specific"
            readOnly={!!review}
            className={review ? 'bg-gray-50' : ''}
          />
        </div>

        <div>
          <Label htmlFor="rating">Rating</Label>
          <div className="flex items-center gap-4">
            {renderStars(rating, !review)}
            <span className="text-sm text-gray-600">({rating}/5)</span>
          </div>
          <input
            type="hidden"
            {...register('rating', { required: true, min: 1, max: 5 })}
          />
          {errors.rating && <p className="text-red-500 text-sm">Rating is required</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          {...register('title', { required: 'Title is required' })}
          readOnly={!!review}
          className={review ? 'bg-gray-50' : ''}
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="content">Review Content</Label>
        <Textarea
          id="content"
          {...register('content', { required: 'Content is required' })}
          readOnly={!!review}
          className={review ? 'bg-gray-50' : ''}
          rows={6}
        />
        {errors.content && <p className="text-red-500 text-sm">{errors.content.message}</p>}
      </div>

      {review && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Approval Management</h3>

          <div className="flex items-center space-x-2 mb-4">
            <input
              id="is_approved"
              type="checkbox"
              {...register('is_approved')}
              className="rounded"
            />
            <Label htmlFor="is_approved">Approve this review</Label>
          </div>

          {review.approved_at && (
            <div className="text-sm text-green-600">
              Approved on {new Date(review.approved_at).toLocaleString()}
              {review.approved_by && ' by admin'}
            </div>
          )}

          <div className="text-sm text-gray-600 mt-2">
            Approved reviews will be displayed publicly on the website.
          </div>
        </div>
      )}

      {review && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-medium mb-4">Response Management</h3>

          <div>
            <Label htmlFor="response">Admin Response (optional)</Label>
            <Textarea
              id="response"
              {...register('response')}
              placeholder="Enter your response to this review..."
              rows={4}
            />
            <p className="text-sm text-gray-600 mt-1">
              Adding a response will help address customer feedback and show engagement.
            </p>
          </div>

          {review.responded_at && (
            <div className="mt-2 text-sm text-blue-600">
              Responded on {new Date(review.responded_at).toLocaleString()}
              {review.responded_by && ' by admin'}
            </div>
          )}
        </div>
      )}

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : (review ? 'Update Review' : 'Create Review')}
        </Button>
      </ModalFooter>
    </form>
  );
}