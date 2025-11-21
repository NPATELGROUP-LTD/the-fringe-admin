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
import type { EmailCampaign, EmailTemplate } from '@/types/database';

interface CampaignFormData {
  name: string;
  subject: string;
  content: string;
  template_id?: string;
  segment_filters: Record<string, any>;
  scheduled_at?: string;
}

interface CampaignFormProps {
  campaign?: EmailCampaign | null;
  onSave: () => void;
  onCancel: () => void;
}

interface TemplatesResponse {
  data: EmailTemplate[];
}

export function CampaignForm({ campaign, onSave, onCancel }: CampaignFormProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [segmentFilters, setSegmentFilters] = useState<Record<string, any>>(campaign?.segment_filters || {});

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CampaignFormData>({
    defaultValues: {
      name: campaign?.name || '',
      subject: campaign?.subject || '',
      content: campaign?.content || '',
      template_id: campaign?.template_id || '',
      segment_filters: campaign?.segment_filters || {},
      scheduled_at: campaign?.scheduled_at ? new Date(campaign.scheduled_at).toISOString().slice(0, 16) : '',
    },
  });

  const selectedTemplateId = watch('template_id');
  const content = watch('content');
  const { request: saveRequest, loading: saving, data: templatesData } = useApiRequest<TemplatesResponse>();

  // Load email templates
  useEffect(() => {
    const loadTemplates = async () => {
      await saveRequest('/api/newsletter/templates');
    };
    loadTemplates();
  }, []);

  useEffect(() => {
    if (templatesData?.data) {
      setTemplates(templatesData.data.filter((t: EmailTemplate) => t.is_active));
    }
  }, [templatesData]);

  // Load template content when template is selected
  useEffect(() => {
    if (selectedTemplateId) {
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
      if (selectedTemplate && !campaign) { // Only auto-fill for new campaigns
        setValue('subject', selectedTemplate.subject);
        setValue('content', selectedTemplate.content);
      }
    }
  }, [selectedTemplateId, templates, campaign, setValue]);

  const onSubmit = async (data: CampaignFormData) => {
    try {
      const url = campaign ? `/api/email/campaigns/${campaign.id}` : '/api/email/campaigns';
      const method = campaign ? 'PUT' : 'POST';

      const campaignData = {
        ...data,
        segment_filters: segmentFilters,
        scheduled_at: data.scheduled_at || null,
      };

      await saveRequest(url, {
        method,
        body: campaignData,
      });

      onSave();
    } catch (error) {
      console.error('Error saving email campaign:', error);
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

  const updateSegmentFilter = (key: string, value: any) => {
    setSegmentFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const removeSegmentFilter = (key: string) => {
    setSegmentFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const COMMON_VARIABLES = [
    '{{first_name}}',
    '{{last_name}}',
    '{{email}}',
    '{{unsubscribe_link}}',
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Campaign Name *</Label>
        <Input
          id="name"
          {...register('name', { required: 'Campaign name is required' })}
          placeholder="e.g., Summer Sale Newsletter, Welcome Campaign"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="template_id">Use Template (Optional)</Label>
        <Select
          id="template_id"
          {...register('template_id')}
        >
          <option value="">Select a template...</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </Select>
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
        <Label htmlFor="content">Email Content *</Label>
        <Textarea
          id="content"
          {...register('content', { required: 'Email content is required' })}
          placeholder="Enter your email campaign content. Use variables like {{first_name}} for personalization."
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

      {/* Subscriber Segmentation */}
      <div>
        <Label className="text-base font-medium">Subscriber Segmentation</Label>
        <p className="text-sm text-gray-600 mb-3">Filter which subscribers will receive this campaign</p>

        {/* Add new filter */}
        <div className="flex gap-2 mb-3">
          <Select
            onChange={(e) => {
              const filterType = e.target.value;
              if (filterType) {
                updateSegmentFilter(filterType, '');
                e.target.value = '';
              }
            }}
            className="flex-1"
          >
            <option value="">Add filter...</option>
            <option value="status">Subscription Status</option>
            <option value="interests">Interests</option>
            <option value="subscribed_after">Subscribed After</option>
            <option value="subscribed_before">Subscribed Before</option>
          </Select>
        </div>

        {/* Active filters */}
        {Object.entries(segmentFilters).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded">
            <span className="text-sm font-medium capitalize">{key.replace('_', ' ')}:</span>
            {key === 'status' && (
              <Select
                value={value}
                onChange={(e) => updateSegmentFilter(key, e.target.value)}
                className="flex-1"
              >
                <option value="subscribed">Subscribed</option>
                <option value="unsubscribed">Unsubscribed</option>
                <option value="pending">Pending</option>
              </Select>
            )}
            {key === 'interests' && (
              <Input
                value={value}
                onChange={(e) => updateSegmentFilter(key, e.target.value)}
                placeholder="Comma-separated interests"
                className="flex-1"
              />
            )}
            {(key === 'subscribed_after' || key === 'subscribed_before') && (
              <Input
                type="date"
                value={value}
                onChange={(e) => updateSegmentFilter(key, e.target.value)}
                className="flex-1"
              />
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeSegmentFilter(key)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="scheduled_at">Schedule Send (Optional)</Label>
        <Input
          id="scheduled_at"
          type="datetime-local"
          {...register('scheduled_at')}
          placeholder="Leave empty to send immediately"
        />
        <p className="text-sm text-gray-600 mt-1">If not set, campaign will be saved as draft</p>
      </div>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : (campaign ? 'Update Campaign' : 'Create Campaign')}
        </Button>
      </ModalFooter>
    </form>
  );
}