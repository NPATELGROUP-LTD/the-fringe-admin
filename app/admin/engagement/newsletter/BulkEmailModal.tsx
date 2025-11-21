'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { useApiRequest } from '@/lib/hooks/useApiRequest';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
}

interface BulkEmailFormData {
  templateId: string;
  subject: string;
  content: string;
}

interface BulkEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSubscriberIds: string[];
  onEmailSent: () => void;
}

export function BulkEmailModal({ isOpen, onClose, selectedSubscriberIds, onEmailSent }: BulkEmailModalProps) {
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ total: number; successful: number; failed: number } | null>(null);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<BulkEmailFormData>();

  const { request: sendEmailRequest, request: loadTemplatesRequest } = useApiRequest();

  const selectedTemplateId = watch('templateId');

  // Load templates when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  // Load email templates
  const loadTemplates = async () => {
    try {
      const result = await loadTemplatesRequest('/api/newsletter/templates?active_only=true');
      if (result) {
        setTemplates(result);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  // Handle template selection
  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setValue('subject', template.subject);
      setValue('content', template.content);
    } else {
      // Custom template selected
      setValue('subject', '');
      setValue('content', '');
    }
  };

  const onSubmit = async (data: BulkEmailFormData) => {
    if (selectedSubscriberIds.length === 0) return;

    setSending(true);
    setSendResult(null);

    try {
      const result = await sendEmailRequest('/api/newsletter/send', {
        method: 'POST',
        body: {
          subscriberIds: selectedSubscriberIds,
          subject: data.subject,
          content: data.content,
        },
      });

      if (result) {
        setSendResult(result);
        reset();
        onEmailSent();
      }
    } catch (error) {
      console.error('Error sending bulk email:', error);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSendResult(null);
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalHeader>
        Send Bulk Email
      </ModalHeader>
      <ModalBody>
        {sendResult ? (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-green-600 mb-2">Email Sent Successfully!</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{sendResult.total}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{sendResult.successful}</div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{sendResult.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="recipientCount">Recipients</Label>
              <div className="text-sm text-gray-600 mb-2">
                {selectedSubscriberIds.length} subscriber{selectedSubscriberIds.length !== 1 ? 's' : ''} selected
              </div>
            </div>

            <div>
              <Label htmlFor="templateId">Email Template</Label>
              <Select
                id="templateId"
                {...register('templateId')}
                onChange={(e) => handleTemplateChange(e.target.value)}
              >
                <option value="">Custom Email</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.category})
                  </option>
                ))}
              </Select>
              <div className="text-sm text-gray-600 mt-1">
                Select a template to pre-fill the subject and content, or choose "Custom Email" to start fresh.
              </div>
            </div>

            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                {...register('subject', { required: 'Subject is required' })}
                placeholder="Enter email subject"
              />
              {errors.subject && <p className="text-red-500 text-sm">{errors.subject.message}</p>}
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                {...register('content', { required: 'Content is required' })}
                placeholder="Enter email content (HTML supported)"
                rows={10}
              />
              {errors.content && <p className="text-red-500 text-sm">{errors.content.message}</p>}
              <div className="text-sm text-gray-600 mt-2">
                <p>You can use these placeholders:</p>
                <ul className="list-disc list-inside mt-1">
                  <li><code>{'{{first_name}}'}</code> - Subscriber's first name</li>
                  <li><code>{'{{last_name}}'}</code> - Subscriber's last name</li>
                  <li><code>{'{{email}}'}</code> - Subscriber's email</li>
                </ul>
              </div>
            </div>
          </form>
        )}
      </ModalBody>
      <ModalFooter>
        {sendResult ? (
          <Button onClick={handleClose}>
            Close
          </Button>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={sending || selectedSubscriberIds.length === 0}
            >
              {sending ? 'Sending...' : `Send to ${selectedSubscriberIds.length} Subscriber${selectedSubscriberIds.length !== 1 ? 's' : ''}`}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}