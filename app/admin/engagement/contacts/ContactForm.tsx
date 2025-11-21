'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { ModalFooter } from '@/components/ui/Modal';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { ContactSubmission } from '@/types/database';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  is_read: boolean;
  response?: string;
}

interface ContactFormProps {
  contact?: ContactSubmission | null;
  onSave: () => void;
  onCancel: () => void;
}

export function ContactForm({ contact, onSave, onCancel }: ContactFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ContactFormData>({
    defaultValues: {
      name: contact?.name || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      subject: contact?.subject || '',
      message: contact?.message || '',
      is_read: contact?.is_read ?? false,
      response: contact?.response || '',
    },
  });

  const { request: saveRequest, loading: saving } = useApiRequest();
  const isRead = watch('is_read');

  const onSubmit = async (data: ContactFormData) => {
    try {
      const url = contact ? `/api/contacts/${contact.id}` : '/api/contacts';
      const method = contact ? 'PUT' : 'POST';

      // For updates, only send the fields that can be modified
      const updateData = contact ? {
        is_read: data.is_read,
        response: data.response || null,
      } : data;

      await saveRequest(url, {
        method,
        body: updateData,
      });

      onSave();
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            {...register('name', { required: 'Name is required' })}
            readOnly={!!contact}
            className={contact ? 'bg-gray-50' : ''}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            {...register('email', { required: 'Email is required' })}
            readOnly={!!contact}
            className={contact ? 'bg-gray-50' : ''}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            {...register('phone')}
            readOnly={!!contact}
            className={contact ? 'bg-gray-50' : ''}
          />
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            {...register('subject', { required: 'Subject is required' })}
            readOnly={!!contact}
            className={contact ? 'bg-gray-50' : ''}
          />
          {errors.subject && <p className="text-red-500 text-sm">{errors.subject.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          {...register('message', { required: 'Message is required' })}
          readOnly={!!contact}
          className={contact ? 'bg-gray-50' : ''}
          rows={6}
        />
        {errors.message && <p className="text-red-500 text-sm">{errors.message.message}</p>}
      </div>

      {contact && (
        <>
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-4">Response Management</h3>

            <div className="flex items-center space-x-2 mb-4">
              <input
                id="is_read"
                type="checkbox"
                {...register('is_read')}
                className="rounded"
              />
              <Label htmlFor="is_read">Mark as Read</Label>
            </div>

            <div>
              <Label htmlFor="response">Response (optional)</Label>
              <Textarea
                id="response"
                {...register('response')}
                placeholder="Enter your response to this contact submission..."
                rows={4}
              />
              <p className="text-sm text-gray-600 mt-1">
                Adding a response will automatically mark this as responded
              </p>
            </div>

            {contact.responded_at && (
              <div className="mt-2 text-sm text-green-600">
                Responded on {new Date(contact.responded_at).toLocaleString()}
              </div>
            )}
          </div>
        </>
      )}

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : (contact ? 'Update Contact' : 'Create Contact')}
        </Button>
      </ModalFooter>
    </form>
  );
}