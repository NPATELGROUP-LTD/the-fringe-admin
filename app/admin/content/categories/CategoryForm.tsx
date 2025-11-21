'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { ModalFooter } from '@/components/ui/Modal';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { CourseCategory, ServiceCategory } from '@/types/database';

interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

interface CategoryFormProps {
  category?: CourseCategory | ServiceCategory | null;
  categoryType: 'courses' | 'services';
  onSave: () => void;
  onCancel: () => void;
}

export function CategoryForm({ category, categoryType, onSave, onCancel }: CategoryFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CategoryFormData>({
    defaultValues: {
      name: category?.name || '',
      slug: category?.slug || '',
      description: category?.description || '',
      sort_order: category?.sort_order || 0,
      is_active: category?.is_active ?? true,
    },
  });

  const { request: saveRequest, loading: saving } = useApiRequest();

  // Auto-generate slug from name
  const name = watch('name');
  useEffect(() => {
    if (name && !category) { // Only auto-generate for new categories
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', slug);
    }
  }, [name, category, setValue]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const endpoint = categoryType === 'courses' ? '/api/categories' : '/api/service-categories';
      const url = category ? `${endpoint}/${category.id}` : endpoint;
      const method = category ? 'PUT' : 'POST';

      await saveRequest(url, {
        method,
        body: data,
      });

      onSave();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          {...register('name', { required: 'Name is required' })}
          placeholder="Category name"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="slug">Slug *</Label>
        <Input
          id="slug"
          {...register('slug', { required: 'Slug is required' })}
          placeholder="category-slug"
        />
        {errors.slug && <p className="text-red-500 text-sm">{errors.slug.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Category description"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="sort_order">Sort Order</Label>
        <Input
          id="sort_order"
          type="number"
          {...register('sort_order', { valueAsNumber: true, min: 0 })}
          placeholder="0"
        />
        {errors.sort_order && <p className="text-red-500 text-sm">{errors.sort_order.message}</p>}
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
          {saving ? 'Saving...' : (category ? 'Update Category' : 'Create Category')}
        </Button>
      </ModalFooter>
    </form>
  );
}