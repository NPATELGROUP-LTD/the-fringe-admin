'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { NewsletterSubscription } from '@/types/database';
import { NewsletterForm } from './NewsletterForm';

interface NewsletterDisplayData {
  id: string;
  email: string;
  name: string;
  status: string;
  interests: string;
  subscribed_at: string;
  unsubscribed_at: string;
  // Keep original data for editing
  original?: NewsletterSubscription;
}

interface NewsletterResponse {
  data: NewsletterSubscription[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function NewsletterPage() {
  const [subscriptions, setSubscriptions] = useState<NewsletterDisplayData[]>([]);
  const [originalSubscriptions, setOriginalSubscriptions] = useState<NewsletterSubscription[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingSubscription, setViewingSubscription] = useState<NewsletterSubscription | null>(null);
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, loading, error, request } = useApiRequest<NewsletterResponse>();

  // Load subscriptions
  const loadSubscriptions = async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter) params.append('status', statusFilter);

    await request(`/api/newsletter?${params.toString()}`);
  };

  useEffect(() => {
    loadSubscriptions();
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    if (data?.data) {
      setOriginalSubscriptions(data.data);
      // Format data for display
      const formattedSubscriptions: NewsletterDisplayData[] = data.data.map(sub => ({
        id: sub.id,
        email: sub.email,
        name: [sub.first_name, sub.last_name].filter(Boolean).join(' ') || 'N/A',
        status: sub.status.charAt(0).toUpperCase() + sub.status.slice(1),
        interests: sub.interests?.join(', ') || 'None',
        subscribed_at: new Date(sub.subscribed_at).toLocaleDateString(),
        unsubscribed_at: sub.unsubscribed_at ? new Date(sub.unsubscribed_at).toLocaleDateString() : 'N/A',
        original: sub,
      }));
      setSubscriptions(formattedSubscriptions);
    }
  }, [data]);

  const handleViewSubscription = (subscription: NewsletterDisplayData) => {
    setViewingSubscription(subscription.original || null);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setViewingSubscription(null);
  };

  const handleSubscriptionSaved = () => {
    handleCloseModal();
    loadSubscriptions(); // Reload subscriptions
  };

  const handleSelectSubscription = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSubscriptions(prev => [...prev, id]);
    } else {
      setSelectedSubscriptions(prev => prev.filter(subId => subId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubscriptions(subscriptions.map(sub => sub.id));
    } else {
      setSelectedSubscriptions([]);
    }
  };

  const handleBulkStatusChange = async (status: 'subscribed' | 'unsubscribed' | 'pending') => {
    if (!selectedSubscriptions.length) return;

    try {
      await Promise.all(
        selectedSubscriptions.map(id =>
          fetch(`/api/newsletter/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
          })
        )
      );
      setSelectedSubscriptions([]);
      loadSubscriptions();
    } catch (error) {
      console.error('Error updating subscriptions:', error);
      alert('Error updating subscriptions');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedSubscriptions.length) return;

    if (!confirm(`Are you sure you want to delete ${selectedSubscriptions.length} subscription(s)?`)) return;

    try {
      await Promise.all(
        selectedSubscriptions.map(id =>
          fetch(`/api/newsletter/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedSubscriptions([]);
      loadSubscriptions();
    } catch (error) {
      console.error('Error deleting subscriptions:', error);
      alert('Error deleting subscriptions');
    }
  };

  const handleExport = async (format: 'csv' | 'xls' = 'csv') => {
    try {
      const params = new URLSearchParams();
      params.append('format', format);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/newsletter/export?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to export subscriptions');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.${format === 'xls' ? 'xls' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting subscriptions:', error);
      alert('Error exporting subscriptions');
    }
  };

  if (loading && subscriptions.length === 0) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-primary">Loading newsletter subscriptions...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="text-red-600">Error loading subscriptions: {error}</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Newsletter Subscriptions</h1>
          <p className="text-primary text-sm md:text-base">Manage newsletter subscribers and their preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('xls')}>
            Export Excel
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Add Subscriber
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search email, name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <Label htmlFor="statusFilter">Status</Label>
          <Select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="subscribed">Subscribed</option>
            <option value="unsubscribed">Unsubscribed</option>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedSubscriptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Button variant="outline" onClick={() => handleBulkStatusChange('subscribed')}>
            Subscribe ({selectedSubscriptions.length})
          </Button>
          <Button variant="outline" onClick={() => handleBulkStatusChange('unsubscribed')}>
            Unsubscribe ({selectedSubscriptions.length})
          </Button>
          <Button variant="outline" onClick={() => handleBulkStatusChange('pending')}>
            Set Pending ({selectedSubscriptions.length})
          </Button>
          <Button variant="secondary" onClick={handleBulkDelete}>
            Delete Selected ({selectedSubscriptions.length})
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
                  checked={selectedSubscriptions.length === subscriptions.length && subscriptions.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="p-4 text-left font-medium">Email</th>
              <th className="p-4 text-left font-medium">Name</th>
              <th className="p-4 text-left font-medium">Status</th>
              <th className="p-4 text-left font-medium">Interests</th>
              <th className="p-4 text-left font-medium">Subscribed</th>
              <th className="p-4 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((subscription) => (
              <tr key={subscription.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedSubscriptions.includes(subscription.id)}
                    onChange={(e) => handleSelectSubscription(subscription.id, e.target.checked)}
                  />
                </td>
                <td className="p-4">{subscription.email}</td>
                <td className="p-4">{subscription.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    subscription.status === 'Subscribed' ? 'bg-green-100 text-green-800' :
                    subscription.status === 'Unsubscribed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {subscription.status}
                  </span>
                </td>
                <td className="p-4">{subscription.interests}</td>
                <td className="p-4">{subscription.subscribed_at}</td>
                <td className="p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewSubscription(subscription)}
                  >
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!viewingSubscription}
        onClose={handleCloseModal}
      >
        <ModalHeader>
          {viewingSubscription ? 'Edit Subscription' : 'Create Subscription'}
        </ModalHeader>
        <ModalBody>
          <NewsletterForm
            subscription={viewingSubscription}
            onSave={handleSubscriptionSaved}
            onCancel={handleCloseModal}
          />
        </ModalBody>
      </Modal>
    </div>
  );
}