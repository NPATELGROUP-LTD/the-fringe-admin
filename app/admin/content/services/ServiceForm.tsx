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
import type { Service, ServiceCategory } from '@/types/database';

interface ServiceFormData {
  title: string;
  slug: string;
  description: string;
  short_description?: string;
  price: number;
  duration: number;
  category_id?: string;
  image_url?: string;
  features?: string[] | string;
  is_active: boolean;
}

interface ServiceWithCategory extends Service {
  service_categories?: ServiceCategory | null;
}

interface ServiceFormProps {
  service?: ServiceWithCategory | null;
  onSave: () => void;
  onCancel: () => void;
}

interface CategoriesResponse {
  data: ServiceCategory[];
}

export function ServiceForm({ service, onSave, onCancel }: ServiceFormProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ServiceFormData>({
    defaultValues: {
      title: service?.title || '',
      slug: service?.slug || '',
      description: service?.description || '',
      short_description: service?.short_description || '',
      price: service?.price || 0,
      duration: service?.duration || 60,
      category_id: service?.category_id || '',
      image_url: service?.image_url || '',
      features: service?.features || [],
      is_active: service?.is_active ?? true,
    },
  });

  const { request: saveRequest, loading: saving } = useApiRequest();
  const { request: loadCategoriesRequest, data: categoriesData } = useApiRequest<CategoriesResponse>();

  // Load categories
  useEffect(() => {
    loadCategoriesRequest('/api/service-categories');
  }, [loadCategoriesRequest]);

  useEffect(() => {
    if (categoriesData?.data) {
      setCategories(categoriesData.data);
    }
  }, [categoriesData]);

  // Auto-generate slug from title
  const title = watch('title');
  useEffect(() => {
    if (title && !service) { // Only auto-generate for new services
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', slug);
    }
  }, [title, service, setValue]);

  const onSubmit = async (data: ServiceFormData) => {
    try {
      const url = service ? `/api/services/${service.id}` : '/api/services';
      const method = service ? 'PUT' : 'POST';

      // Convert features string to array if it's a string
      if (typeof data.features === 'string') {
        data.features = data.features.split(',').map((feature: string) => feature.trim()).filter((feature: string) => feature);
      }

      await saveRequest(url, {
        method,
        body: data,
      });

      onSave();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          {...register('title', { required: 'Title is required' })}
          placeholder="Service title"
        />
        {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="slug">Slug *</Label>
        <Input
          id="slug"
          {...register('slug', { required: 'Slug is required' })}
          placeholder="service-slug"
        />
        {errors.slug && <p className="text-red-500 text-sm">{errors.slug.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register('description', { required: 'Description is required' })}
          placeholder="Service description"
          rows={4}
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
      </div>

      <div>
        <Label htmlFor="short_description">Short Description</Label>
        <Textarea
          id="short_description"
          {...register('short_description')}
          placeholder="Brief service summary"
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
          label="Service Image"
          value={watch('image_url')}
          onChange={(url) => setValue('image_url', url)}
        />
      </div>

      <div>
        <Label htmlFor="features">Features (comma-separated)</Label>
        <Textarea
          id="features"
          {...register('features')}
          placeholder="Feature 1, Feature 2, Feature 3"
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
          {saving ? 'Saving...' : (service ? 'Update Service' : 'Create Service')}
        </Button>
      </ModalFooter>
    </form>
  );
}