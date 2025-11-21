'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { ContactSubmission } from '@/types/database';
import { ContactForm } from './ContactForm';

interface ContactDisplayData {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  phone: string;
  status: string;
  responded: string;
  created_at: string;
  // Keep original data for editing
  original?: ContactSubmission;
}

interface ContactsResponse {
  data: ContactSubmission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactDisplayData[]>([]);
  const [originalContacts, setOriginalContacts] = useState<ContactSubmission[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingContact, setViewingContact] = useState<ContactSubmission | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [readFilter, setReadFilter] = useState('');

  const { data, loading, error, request } = useApiRequest<ContactsResponse>();

  // Load contacts
  const loadContacts = async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (readFilter) params.append('is_read', readFilter);

    await request(`/api/contacts?${params.toString()}`);
  };

  useEffect(() => {
    loadContacts();
  }, [searchTerm, readFilter]);

  useEffect(() => {
    if (data?.data) {
      setOriginalContacts(data.data);
      // Format data for display
      const formattedContacts: ContactDisplayData[] = data.data.map(contact => ({
        id: contact.id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        message: contact.message.length > 100 ? contact.message.substring(0, 100) + '...' : contact.message,
        phone: contact.phone || 'N/A',
        status: contact.is_read ? 'Read' : 'Unread',
        responded: contact.responded_at ? 'Yes' : 'No',
        created_at: new Date(contact.created_at).toLocaleDateString(),
        original: contact,
      }));
      setContacts(formattedContacts);
    }
  }, [data]);

  const handleViewContact = (contact: ContactDisplayData) => {
    setViewingContact(contact.original || null);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setViewingContact(null);
  };

  const handleContactSaved = () => {
    handleCloseModal();
    loadContacts(); // Reload contacts
  };

  const handleSelectContact = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedContacts(prev => [...prev, id]);
    } else {
      setSelectedContacts(prev => prev.filter(contactId => contactId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(contacts.map(contact => contact.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleBulkMarkRead = async (read: boolean) => {
    if (!selectedContacts.length) return;

    try {
      await Promise.all(
        selectedContacts.map(id =>
          fetch(`/api/contacts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_read: read })
          })
        )
      );
      setSelectedContacts([]);
      loadContacts();
    } catch (error) {
      console.error('Error updating contacts:', error);
      alert('Error updating contacts');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedContacts.length) return;

    if (!confirm(`Are you sure you want to delete ${selectedContacts.length} contact(s)?`)) return;

    try {
      await Promise.all(
        selectedContacts.map(id =>
          fetch(`/api/contacts/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedContacts([]);
      loadContacts();
    } catch (error) {
      console.error('Error deleting contacts:', error);
      alert('Error deleting contacts');
    }
  };

  const handleExport = async (format: 'csv' | 'xls' = 'csv') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (readFilter) params.append('is_read', readFilter);

      const response = await fetch(`/api/contacts/export?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to export contacts');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contact_submissions_${new Date().toISOString().split('T')[0]}.${format === 'xls' ? 'xls' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting contacts:', error);
      alert('Error exporting contacts');
    }
  };

  const columns: Column<ContactDisplayData>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
    },
    {
      key: 'message',
      label: 'Message',
      sortable: false,
    },
    {
      key: 'phone',
      label: 'Phone',
      sortable: false,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
    },
    {
      key: 'responded',
      label: 'Responded',
      sortable: true,
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
    },
  ];

  if (loading && contacts.length === 0) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-primary">Loading contacts...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="text-red-600">Error loading contacts: {error}</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Contact Submissions</h1>
          <p className="text-primary text-sm md:text-base">Manage customer inquiries and messages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('xls')}>
            Export Excel
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Add Contact
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search name, email, subject, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <Label htmlFor="readStatus">Read Status</Label>
          <Select
            id="readStatus"
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="false">Unread</option>
            <option value="true">Read</option>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button variant="outline" onClick={() => handleBulkMarkRead(true)}>
            Mark as Read ({selectedContacts.length})
          </Button>
          <Button variant="outline" onClick={() => handleBulkMarkRead(false)}>
            Mark as Unread ({selectedContacts.length})
          </Button>
          <Button variant="secondary" onClick={handleBulkDelete}>
            Delete Selected ({selectedContacts.length})
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
                  checked={selectedContacts.length === contacts.length && contacts.length > 0}
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
            {contacts.map((contact) => (
              <tr key={contact.id} className={`border-b hover:bg-gray-50 ${!contact.original?.is_read ? 'bg-blue-50' : ''}`}>
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedContacts.includes(contact.id)}
                    onChange={(e) => handleSelectContact(contact.id, e.target.checked)}
                  />
                </td>
                {columns.map((column) => (
                  <td key={String(column.key)} className="p-4">
                    {String(contact[column.key as keyof ContactDisplayData])}
                  </td>
                ))}
                <td className="p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewContact(contact)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!viewingContact}
        onClose={handleCloseModal}
      >
        <ModalHeader>
          {viewingContact ? 'View Contact Submission' : 'Create Contact Submission'}
        </ModalHeader>
        <ModalBody>
          <ContactForm
            contact={viewingContact}
            onSave={handleContactSaved}
            onCancel={handleCloseModal}
          />
        </ModalBody>
      </Modal>
    </div>
  );
}