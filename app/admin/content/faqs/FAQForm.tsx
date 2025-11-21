'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { ModalFooter } from '@/components/ui/Modal';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { FAQ } from '@/types/database';

interface FAQFormData {
  category?: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

interface FAQFormProps {
  faq?: FAQ | null;
  onSave: () => void;
  onCancel: () => void;
}

export function FAQForm({ faq, onSave, onCancel }: FAQFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FAQFormData>({
    defaultValues: {
      category: faq?.category || '',
      question: faq?.question || '',
      answer: faq?.answer || '',
      sort_order: faq?.sort_order || 0,
      is_active: faq?.is_active ?? true,
    },
  });

  const { request: saveRequest, loading: saving } = useApiRequest();

  const onSubmit = async (data: FAQFormData) => {
    try {
      const url = faq ? `/api/faqs/${faq.id}` : '/api/faqs';
      const method = faq ? 'PUT' : 'POST';

      await saveRequest(url, {
        method,
        body: data,
      });

      onSave();
    } catch (error) {
      console.error('Error saving FAQ:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="category">Category (optional)</Label>
        <Input
          id="category"
          {...register('category')}
          placeholder="e.g., General, Pricing, Services"
        />
      </div>

      <div>
        <Label htmlFor="question">Question *</Label>
        <Input
          id="question"
          {...register('question', { required: 'Question is required' })}
          placeholder="Enter the FAQ question"
        />
        {errors.question && <p className="text-red-500 text-sm">{errors.question.message}</p>}
      </div>

      <div>
        <Label htmlFor="answer">Answer *</Label>
        <Textarea
          id="answer"
          {...register('answer', { required: 'Answer is required' })}
          placeholder="Enter the FAQ answer"
          rows={6}
        />
        {errors.answer && <p className="text-red-500 text-sm">{errors.answer.message}</p>}
      </div>

      <div>
        <Label htmlFor="sort_order">Sort Order</Label>
        <Input
          id="sort_order"
          type="number"
          {...register('sort_order', { valueAsNumber: true })}
          placeholder="0"
        />
        <p className="text-sm text-gray-600">Lower numbers appear first</p>
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
          {saving ? 'Saving...' : (faq ? 'Update FAQ' : 'Create FAQ')}
        </Button>
      </ModalFooter>
    </form>
  );
}