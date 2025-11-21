'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { ModalFooter } from '@/components/ui/Modal';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { EmailTemplate } from '@/types/database';

interface EmailTemplateFormData {
  name: string;
  subject: string;
  content: string;
  category: string;
  variables: string[];
  is_active: boolean;
}

interface EmailTemplateFormProps {
  template?: EmailTemplate | null;
  onSave: () => void;
  onCancel: () => void;
}

const COMMON_VARIABLES = [
  '{{first_name}}',
  '{{last_name}}',
  '{{email}}',
  '{{company}}',
  '{{unsubscribe_link}}',
  '{{site_name}}',
  '{{site_url}}',
];

const TEMPLATE_CATEGORIES = [
  'general',
  'welcome',
  'newsletter',
  'marketing',
  'transactional',
  'notification',
];

export function EmailTemplateForm({ template, onSave, onCancel }: EmailTemplateFormProps) {
  const [variables, setVariables] = useState<string[]>(template?.variables || []);
  const [newVariable, setNewVariable] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<EmailTemplateFormData>({
    defaultValues: {
      name: template?.name || '',
      subject: template?.subject || '',
      content: template?.content || '',
      category: template?.category || 'general',
      variables: template?.variables || [],
      is_active: template?.is_active ?? true,
    },
  });

  const content = watch('content');
  const { request: saveRequest, loading: saving } = useApiRequest();

  const onSubmit = async (data: EmailTemplateFormData) => {
    try {
      const url = template ? `/api/newsletter/templates/${template.id}` : '/api/newsletter/templates';
      const method = template ? 'PUT' : 'POST';

      const templateData = {
        ...data,
        variables,
      };

      await saveRequest(url, {
        method,
        body: templateData,
      });

      onSave();
    } catch (error) {
      console.error('Error saving email template:', error);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = content || '';
      const newContent = currentContent.substring(0, start) + variable + currentContent.substring(end);
      setValue('content', newContent);
      // Focus back to textarea and set cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const addCustomVariable = () => {
    if (newVariable.trim() && !variables.includes(newVariable.trim())) {
      setVariables([...variables, newVariable.trim()]);
      setNewVariable('');
    }
  };

  const removeVariable = (variable: string) => {
    setVariables(variables.filter(v => v !== variable));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Template Name *</Label>
        <Input
          id="name"
          {...register('name', { required: 'Template name is required' })}
          placeholder="e.g., Welcome Email, Newsletter Template"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="subject">Email Subject *</Label>
        <Input
          id="subject"
          {...register('subject', { required: 'Email subject is required' })}
          placeholder="Enter email subject line"
        />
        {errors.subject && <p className="text-red-500 text-sm">{errors.subject.message}</p>}
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          id="category"
          {...register('category')}
        >
          {TEMPLATE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="content">Email Content *</Label>
        <Textarea
          id="content"
          {...register('content', { required: 'Email content is required' })}
          placeholder="Enter your email template content. Use variables like {{first_name}} for personalization."
          rows={12}
          className="font-mono text-sm"
        />
        {errors.content && <p className="text-red-500 text-sm">{errors.content.message}</p>}

        {/* Variable Insertion Tools */}
        <div className="mt-2">
          <Label className="text-sm font-medium">Insert Variables:</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {COMMON_VARIABLES.map((variable) => (
              <Button
                key={variable}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => insertVariable(variable)}
                className="text-xs"
              >
                {variable}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Variables */}
      <div>
        <Label>Custom Variables</Label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder="Add custom variable (e.g., {{custom_field}})"
            value={newVariable}
            onChange={(e) => setNewVariable(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomVariable())}
          />
          <Button type="button" onClick={addCustomVariable} variant="outline">
            Add
          </Button>
        </div>
        {variables.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {variables.map((variable) => (
              <span
                key={variable}
                className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
              >
                {variable}
                <button
                  type="button"
                  onClick={() => removeVariable(variable)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
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
          {saving ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}
        </Button>
      </ModalFooter>
    </form>
  );
}