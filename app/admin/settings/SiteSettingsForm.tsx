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
import type { SiteSetting } from '@/types/database';

interface SiteSettingsFormData {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: string;
  description?: string;
  is_public: boolean;
}

interface SiteSettingsFormProps {
  setting?: SiteSetting | null;
  onSave: () => void;
  onCancel: () => void;
}

const SETTING_CATEGORIES = [
  'General',
  'Email',
  'SEO',
  'Social Media',
  'Analytics',
  'Payment',
  'Development',
  'Production',
  'Staging',
];

export function SiteSettingsForm({ setting, onSave, onCancel }: SiteSettingsFormProps) {
  const [valueInput, setValueInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<SiteSettingsFormData>({
    defaultValues: {
      key: setting?.key || '',
      value: setting?.value || '',
      type: setting?.type || 'string',
      category: setting?.category || 'General',
      description: setting?.description || '',
      is_public: setting?.is_public ?? false,
    },
  });

  const watchedType = watch('type');
  const { request: saveRequest, loading: saving } = useApiRequest();

  // Update value input when setting changes
  useEffect(() => {
    if (setting) {
      const value = setting.value;
      if (setting.type === 'json') {
        setValueInput(JSON.stringify(value, null, 2));
      } else if (setting.type === 'boolean') {
        setValueInput(value ? 'true' : 'false');
      } else {
        setValueInput(String(value));
      }
    }
  }, [setting]);

  // Update value input when type changes
  useEffect(() => {
    if (!setting) {
      // For new settings, reset value input based on type
      if (watchedType === 'boolean') {
        setValueInput('false');
      } else if (watchedType === 'number') {
        setValueInput('0');
      } else if (watchedType === 'json') {
        setValueInput('{}');
      } else {
        setValueInput('');
      }
    }
  }, [watchedType, setting]);

  const validateAndParseValue = (type: string, inputValue: string) => {
    try {
      switch (type) {
        case 'string':
          return { valid: true, value: inputValue };
        case 'number':
          const num = Number(inputValue);
          if (isNaN(num)) {
            return { valid: false, error: 'Invalid number' };
          }
          return { valid: true, value: num };
        case 'boolean':
          if (inputValue === 'true' || inputValue === 'false') {
            return { valid: true, value: inputValue === 'true' };
          }
          return { valid: false, error: 'Boolean must be true or false' };
        case 'json':
          const parsed = JSON.parse(inputValue);
          return { valid: true, value: parsed };
        default:
          return { valid: false, error: 'Invalid type' };
      }
    } catch (error) {
      return { valid: false, error: type === 'json' ? 'Invalid JSON' : 'Invalid value' };
    }
  };

  const onSubmit = async (data: SiteSettingsFormData) => {
    try {
      const validation = validateAndParseValue(data.type, valueInput);
      if (!validation.valid) {
        setJsonError(validation.error || 'Invalid value');
        return;
      }

      setJsonError('');

      const url = setting ? `/api/site-settings/${setting.id}` : '/api/site-settings';
      const method = setting ? 'PUT' : 'POST';

      await saveRequest(url, {
        method,
        body: {
          ...data,
          value: validation.value,
        },
      });

      onSave();
    } catch (error) {
      console.error('Error saving site setting:', error);
    }
  };

  const handleValueChange = (value: string) => {
    setValueInput(value);
    if (jsonError) setJsonError('');
  };

  const renderValueInput = () => {
    switch (watchedType) {
      case 'boolean':
        return (
          <Select
            value={valueInput}
            onChange={(e) => handleValueChange(e.target.value)}
          >
            <option value="false">False</option>
            <option value="true">True</option>
          </Select>
        );
      case 'json':
        return (
          <div>
            <Textarea
              value={valueInput}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder='{"key": "value"}'
              rows={6}
              className={jsonError ? 'border-red-500' : ''}
            />
            {jsonError && <p className="text-red-500 text-sm mt-1">{jsonError}</p>}
          </div>
        );
      case 'number':
        return (
          <Input
            type="number"
            value={valueInput}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="0"
          />
        );
      default:
        return (
          <Input
            value={valueInput}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Enter value"
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="key">Key *</Label>
        <Input
          id="key"
          {...register('key', { required: 'Key is required' })}
          placeholder="e.g., site_title, api_timeout"
          disabled={!!setting} // Can't change key when editing
        />
        {errors.key && <p className="text-red-500 text-sm">{errors.key.message}</p>}
      </div>

      <div>
        <Label htmlFor="type">Type *</Label>
        <Select
          id="type"
          {...register('type', { required: 'Type is required' })}
          disabled={!!setting} // Can't change type when editing
        >
          <option value="string">String</option>
          <option value="number">Number</option>
          <option value="boolean">Boolean</option>
          <option value="json">JSON</option>
        </Select>
        {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
      </div>

      <div>
        <Label htmlFor="value">Value *</Label>
        {renderValueInput()}
      </div>

      <div>
        <Label htmlFor="category">Category *</Label>
        <Select
          id="category"
          {...register('category', { required: 'Category is required' })}
        >
          {SETTING_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
        {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Optional description of this setting"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <input
          id="is_public"
          type="checkbox"
          {...register('is_public')}
          className="rounded"
        />
        <Label htmlFor="is_public">Public</Label>
        <span className="text-sm text-gray-600">Make this setting accessible via public API</span>
      </div>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : (setting ? 'Update Setting' : 'Create Setting')}
        </Button>
      </ModalFooter>
    </form>
  );
}