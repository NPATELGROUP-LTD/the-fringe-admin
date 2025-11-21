'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { EmailTrigger, EmailTemplate } from '@/types/database';
import { EmailTriggerForm } from './EmailTriggerForm';

interface EmailTriggerDisplayData {
  id: string;
  name: string;
  event_type: string;
  template_name: string;
  is_active: string;
  created_at: string;
  // Keep original data for editing
  original?: EmailTrigger;
}

interface EmailTriggersResponse {
  data: (EmailTrigger & { email_templates?: EmailTemplate })[];
}

const EVENT_TYPES = [
  'user_registration',
  'newsletter_subscription',
  'contact_form_submission',
  'course_enrollment',
  'service_booking',
  'review_approval',
  'testimonial_approval',
  'password_reset',
  'account_verification',
  'custom',
];

export default function EmailTriggersPage() {
  const [triggers, setTriggers] = useState<EmailTriggerDisplayData[]>([]);
  const [originalTriggers, setOriginalTriggers] = useState<EmailTrigger[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<EmailTrigger | null>(null);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('');

  const { data, loading, error, request } = useApiRequest<EmailTriggersResponse>();

  // Load email triggers
  const loadTriggers = async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (eventFilter) params.append('event_type', eventFilter);

    await request(`/api/email/triggers?${params.toString()}`);
  };

  useEffect(() => {
    loadTriggers();
  }, [searchTerm, eventFilter]);

  useEffect(() => {
    if (data?.data) {
      setOriginalTriggers(data.data);
      // Format data for display
      const formattedTriggers: EmailTriggerDisplayData[] = data.data.map(trigger => ({
        id: trigger.id,
        name: trigger.name,
        event_type: trigger.event_type,
        template_name: trigger.email_templates?.name || 'No template',
        is_active: trigger.is_active ? 'Yes' : 'No',
        created_at: new Date(trigger.created_at).toLocaleDateString(),
        original: trigger,
      }));
      setTriggers(formattedTriggers);
    }
  }, [data]);

  const handleCreateTrigger = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditTrigger = (trigger: EmailTriggerDisplayData) => {
    setEditingTrigger(trigger.original || null);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingTrigger(null);
  };

  const handleTriggerSaved = () => {
    handleCloseModal();
    loadTriggers(); // Reload triggers
  };

  const handleSelectTrigger = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTriggers(prev => [...prev, id]);
    } else {
      setSelectedTriggers(prev => prev.filter(triggerId => triggerId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTriggers(triggers.map(trigger => trigger.id));
    } else {
      setSelectedTriggers([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedTriggers.length) return;

    if (!confirm(`Are you sure you want to delete ${selectedTriggers.length} trigger(s)?`)) return;

    try {
      await Promise.all(
        selectedTriggers.map(id =>
          fetch(`/api/email/triggers/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedTriggers([]);
      loadTriggers();
    } catch (error) {
      console.error('Error deleting triggers:', error);
      alert('Error deleting triggers');
    }
  };

  const handleBulkActivate = async (activate: boolean) => {
    if (!selectedTriggers.length) return;

    try {
      await Promise.all(
        selectedTriggers.map(id =>
          fetch(`/api/email/triggers/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: activate })
          })
        )
      );
      setSelectedTriggers([]);
      loadTriggers();
    } catch (error) {
      console.error('Error updating triggers:', error);
      alert('Error updating triggers');
    }
  };

  const columns: Column<EmailTriggerDisplayData>[] = [
    {
      key: 'name',
      label: 'Trigger Name',
      sortable: true,
    },
    {
      key: 'event_type',
      label: 'Event Type',
      sortable: true,
    },
    {
      key: 'template_name',
      label: 'Email Template',
      sortable: true,
    },
    {
      key: 'is_active',
      label: 'Active',
      sortable: true,
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
    },
  ];

  if (loading && triggers.length === 0) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-primary">Loading email triggers...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="text-red-600">Error loading email triggers: {error}</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Email Triggers</h1>
          <p className="text-primary text-sm md:text-base">Set up automated emails based on user actions and events</p>
        </div>
        <Button onClick={handleCreateTrigger}>
          Create Trigger
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search triggers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <Label htmlFor="event_type">Event Type</Label>
          <Select
            id="event_type"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
          >
            <option value="">All Events</option>
            {EVENT_TYPES.map((event) => (
              <option key={event} value={event}>
                {event.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTriggers.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button variant="outline" onClick={() => handleBulkActivate(true)}>
            Activate Selected ({selectedTriggers.length})
          </Button>
          <Button variant="outline" onClick={() => handleBulkActivate(false)}>
            Deactivate Selected ({selectedTriggers.length})
          </Button>
          <Button variant="secondary" onClick={handleBulkDelete}>
            Delete Selected ({selectedTriggers.length})
          </Button>
        </div>
      )}

      <div className="border rounded-lg">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedTriggers.length === triggers.length && triggers.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              {columns.map((column) => (
                <th key={String(column.key)} className="p-4 text-left font-medium">
                  {column.label}
                </th>
              ))}
              <th className="p-4 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {triggers.map((trigger) => (
              <tr key={trigger.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedTriggers.includes(trigger.id)}
                    onChange={(e) => handleSelectTrigger(trigger.id, e.target.checked)}
                  />
                </td>
                {columns.map((column) => (
                  <td key={String(column.key)} className="p-4">
                    {String(trigger[column.key as keyof EmailTriggerDisplayData])}
                  </td>
                ))}
                <td className="p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTrigger(trigger)}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!editingTrigger}
        onClose={handleCloseModal}
      >
        <ModalHeader>
          {editingTrigger ? 'Edit Email Trigger' : 'Create Email Trigger'}
        </ModalHeader>
        <ModalBody>
          <EmailTriggerForm
            trigger={editingTrigger}
            onSave={handleTriggerSaved}
            onCancel={handleCloseModal}
          />
        </ModalBody>
      </Modal>
    </div>
  );
}