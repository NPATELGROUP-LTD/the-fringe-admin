'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { ModalFooter } from '@/components/ui/Modal';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { Course, CourseCategory } from '@/types/database';

interface CourseFormData {
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  duration: number;
  category_id?: string;
  image_url?: string;
  requirements?: Record<string, any> | string;
  tags?: string[] | string;
  is_active: boolean;
}

interface CourseWithCategory extends Course {
  courses_categories?: CourseCategory | null;
}

interface CourseFormProps {
  course?: CourseWithCategory | null;
  onSave: () => void;
  onCancel: () => void;
}

interface CategoriesResponse {
  data: CourseCategory[];
}

export function CourseForm({ course, onSave, onCancel }: CourseFormProps) {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CourseFormData>({
    defaultValues: {
      title: course?.title || '',
      slug: course?.slug || '',
      description: course?.description || '',
      short_description: course?.short_description || '',
      price: course?.price || 0,
      duration: course?.duration || 60,
      category_id: course?.category_id || '',
      image_url: course?.image_url || '',
      requirements: course?.requirements || {},
      tags: course?.tags || [],
      is_active: course?.is_active ?? true,
    },
  });

  const { request: saveRequest, loading: saving } = useApiRequest();
  const { request: loadCategoriesRequest, data: categoriesData } = useApiRequest<CategoriesResponse>();

  // Load categories
  useEffect(() => {
    loadCategoriesRequest('/api/categories');
  }, [loadCategoriesRequest]);

  useEffect(() => {
    if (categoriesData?.data) {
      setCategories(categoriesData.data);
    }
  }, [categoriesData]);

  // Auto-generate slug from title
  const title = watch('title');
  useEffect(() => {
    if (title && !course) { // Only auto-generate for new courses
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', slug);
    }
  }, [title, course, setValue]);

  const onSubmit = async (data: CourseFormData) => {
    try {
      const url = course ? `/api/courses/${course.id}` : '/api/courses';
      const method = course ? 'PUT' : 'POST';

      // Convert tags string to array if it's a string
      if (typeof data.tags === 'string') {
        data.tags = data.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
      }

      // Convert requirements to JSON if it's a string
      if (typeof data.requirements === 'string') {
        try {
          data.requirements = JSON.parse(data.requirements);
        } catch {
          data.requirements = {};
        }
      }

      await saveRequest(url, {
        method,
        body: data,
      });

      onSave();
    } catch (error) {
      console.error('Error saving course:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          {...register('title', { required: 'Title is required' })}
          placeholder="Course title"
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="slug">Slug *</Label>
        <Input
          id="slug"
          {...register('slug', { required: 'Slug is required' })}
          placeholder="course-slug"
        />
        {errors.slug && <p className="text-red-500 text-sm">{errors.slug.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register('description', { required: 'Description is required' })}
          placeholder="Course description"
          rows={4}
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
      </div>

      <div>
        <Label htmlFor="short_description">Short Description</Label>
        <Textarea
          id="short_description"
          {...register('short_description')}
          placeholder="Brief course summary"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register('price', { required: 'Price is required', min: 0 })}
            placeholder="0.00"
          />
          {errors.price && <p className="text-red-500 text-sm">{errors.price.message}</p>}
        </div>

        <div>
          <Label htmlFor="duration">Duration (minutes) *</Label>
          <Input
            id="duration"
            type="number"
            {...register('duration', { required: 'Duration is required', min: 1 })}
            placeholder="60"
          />
          {errors.duration && <p className="text-red-500 text-sm">{errors.duration.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="category_id">Category</Label>
        <Select id="category_id" {...register('category_id')}>
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <ImageUpload
          label="Course Image"
          value={watch('image_url')}
          onChange={(url) => setValue('image_url', url)}
        />
      </div>

      <div>
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input
          id="tags"
          {...register('tags')}
          placeholder="tag1, tag2, tag3"
        />
      </div>

      <div>
        <Label htmlFor="requirements">Requirements (JSON)</Label>
        <Textarea
          id="requirements"
          {...register('requirements')}
          placeholder='{"prerequisites": ["Basic knowledge"], "materials": ["Laptop"]}'
          rows={3}
        />
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
          {saving ? 'Saving...' : (course ? 'Update Course' : 'Create Course')}
        </Button>
      </ModalFooter>
    </form>
  );
}