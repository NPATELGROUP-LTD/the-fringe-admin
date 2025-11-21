'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { ModalFooter } from '@/components/ui/Modal';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { EmailTrigger, EmailTemplate } from '@/types/database';

interface EmailTriggerFormData {
  name: string;
  event_type: string;
  template_id: string;
  conditions: Record<string, any>;
  is_active: boolean;
}

interface EmailTriggerFormProps {
  trigger?: EmailTrigger | null;
  onSave: () => void;
  onCancel: () => void;
}

const EVENT_TYPES = [
  { value: 'user_registration', label: 'User Registration' },
  { value: 'newsletter_subscription', label: 'Newsletter Subscription' },
  { value: 'contact_form_submission', label: 'Contact Form Submission' },
  { value: 'course_enrollment', label: 'Course Enrollment' },
  { value: 'service_booking', label: 'Service Booking' },
  { value: 'review_approval', label: 'Review Approval' },
  { value: 'testimonial_approval', label: 'Testimonial Approval' },
  { value: 'password_reset', label: 'Password Reset' },
  { value: 'account_verification', label: 'Account Verification' },
  { value: 'custom', label: 'Custom Event' },
];

export function EmailTriggerForm({ trigger, onSave, onCancel }: EmailTriggerFormProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [conditions, setConditions] = useState<Record<string, any>>(trigger?.conditions || {});

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<EmailTriggerFormData>({
    defaultValues: {
      name: trigger?.name || '',
      event_type: trigger?.event_type || 'user_registration',
      template_id: trigger?.template_id || '',
      conditions: trigger?.conditions || {},
      is_active: trigger?.is_active ?? true,
    },
  });

  const selectedEventType = watch('event_type');

  // Load email templates
  const { data: templatesData } = useApiRequest<{ data: EmailTemplate[] }>();

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('/api/newsletter/templates?active_only=true');
        const data = await response.json();
        if (data.data) {
          setTemplates(data.data);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    };

    loadTemplates();
  }, []);

  const { request: saveRequest, loading: saving } = useApiRequest();

  const onSubmit = async (data: EmailTriggerFormData) => {
    try {
      const url = trigger ? `/api/email/triggers/${trigger.id}` : '/api/email/triggers';
      const method = trigger ? 'PUT' : 'POST';

      const triggerData = {
        ...data,
        conditions,
      };

      await saveRequest(url, {
        method,
        body: triggerData,
      });

      onSave();
    } catch (error) {
      console.error('Error saving email trigger:', error);
    }
  };

  const updateCondition = (key: string, value: any) => {
    const newConditions = { ...conditions, [key]: value };
    setConditions(newConditions);
  };

  const removeCondition = (key: string) => {
    const newConditions = { ...conditions };
    delete newConditions[key];
    setConditions(newConditions);
  };

  const renderConditionFields = () => {
    switch (selectedEventType) {
      case 'course_enrollment':
        return (
          <div className="space-y-2">
            <Label>Course-Specific Conditions</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Course ID (optional)"
                value={conditions.course_id || ''}
                onChange={(e) => updateCondition('course_id', e.target.value)}
              />
              <Input
                placeholder="Category ID (optional)"
                value={conditions.category_id || ''}
                onChange={(e) => updateCondition('category_id', e.target.value)}
              />
            </div>
          </div>
        );

      case 'service_booking':
        return (
          <div className="space-y-2">
            <Label>Service-Specific Conditions</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Service ID (optional)"
                value={conditions.service_id || ''}
                onChange={(e) => updateCondition('service_id', e.target.value)}
              />
              <Input
                placeholder="Category ID (optional)"
                value={conditions.category_id || ''}
                onChange={(e) => updateCondition('category_id', e.target.value)}
              />
            </div>
          </div>
        );

      case 'custom':
        return (
          <div className="space-y-2">
            <Label>Custom Event Conditions</Label>
            <div className="space-y-2">
              {Object.entries(conditions).map(([key, value]) => (
                <div key={key} className="flex gap-2 items-center">
                  <Input
                    placeholder="Condition key"
                    value={key}
                    onChange={(e) => {
                      const newConditions = { ...conditions };
                      delete newConditions[key];
                      newConditions[e.target.value] = value;
                      setConditions(newConditions);
                    }}
                  />
                  <Input
                    placeholder="Condition value"
                    value={String(value)}
                    onChange={(e) => updateCondition(key, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeCondition(key)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => updateCondition(`condition_${Date.now()}`, '')}
              >
                Add Condition
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Label>General Conditions</Label>
            <Input
              placeholder="Additional conditions (JSON format)"
              value={JSON.stringify(conditions, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setConditions(parsed);
                } catch {
                  // Invalid JSON, keep as string for now
                }
              }}
            />
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Trigger Name *</Label>
        <Input
          id="name"
          {...register('name', { required: 'Trigger name is required' })}
          placeholder="e.g., Welcome Email on Registration"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="event_type">Event Type *</Label>
        <Select
          id="event_type"
          {...register('event_type', { required: 'Event type is required' })}
        >
          {EVENT_TYPES.map((event) => (
            <option key={event.value} value={event.value}>
              {event.label}
            </option>
          ))}
        </Select>
        {errors.event_type && <p className="text-red-500 text-sm">{errors.event_type.message}</p>}
      </div>

      <div>
        <Label htmlFor="template_id">Email Template *</Label>
        <Select
          id="template_id"
          {...register('template_id', { required: 'Email template is required' })}
        >
          <option value="">Select a template...</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} - {template.subject}
            </option>
          ))}
        </Select>
        {errors.template_id && <p className="text-red-500 text-sm">{errors.template_id.message}</p>}
      </div>

      {/* Dynamic condition fields based on event type */}
      <div className="border-t pt-4">
        <h3 className="font-medium mb-3">Trigger Conditions</h3>
        {renderConditionFields()}
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
          {saving ? 'Saving...' : (trigger ? 'Update Trigger' : 'Create Trigger')}
        </Button>
      </ModalFooter>
    </form>
  );
}