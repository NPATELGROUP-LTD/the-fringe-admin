'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { EmailCampaign } from '@/types/database';
import { CampaignForm } from './CampaignForm';

interface EmailCampaignDisplayData {
  id: string;
  name: string;
  subject: string;
  status: string;
  total_recipients: string;
  sent_count: string;
  opened_count: string;
  clicked_count: string;
  created_at: string;
  // Keep original data for editing
  original?: EmailCampaign;
}

interface EmailCampaignsResponse {
  data: EmailCampaign[];
  count: number;
  limit: number;
  offset: number;
}

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaignDisplayData[]>([]);
  const [originalCampaigns, setOriginalCampaigns] = useState<EmailCampaign[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 50;

  const { data, loading, error, request } = useApiRequest<EmailCampaignsResponse>();

  // Load email campaigns
  const loadCampaigns = async (page = 1) => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter) params.append('status', statusFilter);
    params.append('limit', pageSize.toString());
    params.append('offset', ((page - 1) * pageSize).toString());

    await request(`/api/email/campaigns?${params.toString()}`);
  };

  useEffect(() => {
    loadCampaigns(currentPage);
  }, [searchTerm, statusFilter, currentPage]);

  useEffect(() => {
    if (data?.data) {
      setOriginalCampaigns(data.data);
      setTotalCount(data.count);
      // Format data for display
      const formattedCampaigns: EmailCampaignDisplayData[] = data.data.map(campaign => ({
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        status: campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1),
        total_recipients: campaign.total_recipients.toString(),
        sent_count: campaign.sent_count.toString(),
        opened_count: campaign.opened_count.toString(),
        clicked_count: campaign.clicked_count.toString(),
        created_at: new Date(campaign.created_at).toLocaleDateString(),
        original: campaign,
      }));
      setCampaigns(formattedCampaigns);
    }
  }, [data]);

  const handleCreateCampaign = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditCampaign = (campaign: EmailCampaignDisplayData) => {
    setEditingCampaign(campaign.original || null);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingCampaign(null);
  };

  const handleCampaignSaved = () => {
    handleCloseModal();
    loadCampaigns(currentPage); // Reload campaigns
  };

  const handleSelectCampaign = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(prev => [...prev, id]);
    } else {
      setSelectedCampaigns(prev => prev.filter(campaignId => campaignId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(campaigns.map(campaign => campaign.id));
    } else {
      setSelectedCampaigns([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedCampaigns.length) return;

    if (!confirm(`Are you sure you want to delete ${selectedCampaigns.length} campaign(s)?`)) return;

    try {
      await Promise.all(
        selectedCampaigns.map(id =>
          fetch(`/api/email/campaigns/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedCampaigns([]);
      loadCampaigns(currentPage);
    } catch (error) {
      console.error('Error deleting campaigns:', error);
      alert('Error deleting campaigns');
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to send this campaign? This action cannot be undone.')) return;

    try {
      const response = await fetch(`/api/email/campaigns/${campaignId}/send`, { method: 'POST' });
      if (response.ok) {
        loadCampaigns(currentPage);
        alert('Campaign sent successfully!');
      } else {
        const error = await response.json();
        alert(`Error sending campaign: ${error.message}`);
      }
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert('Error sending campaign');
    }
  };

  const columns: Column<EmailCampaignDisplayData>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
    },
    {
      key: 'total_recipients',
      label: 'Recipients',
      sortable: true,
    },
    {
      key: 'sent_count',
      label: 'Sent',
      sortable: true,
    },
    {
      key: 'opened_count',
      label: 'Opened',
      sortable: true,
    },
    {
      key: 'clicked_count',
      label: 'Clicked',
      sortable: true,
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
    },
  ];

  if (loading && campaigns.length === 0) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-primary">Loading email campaigns...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="text-red-600">Error loading email campaigns: {error}</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Email Campaigns</h1>
          <p className="text-primary text-sm md:text-base">Create and manage email campaigns with performance tracking</p>
        </div>
        <Button onClick={handleCreateCampaign}>
          Create Campaign
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="paused">Paused</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCampaigns.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button variant="secondary" onClick={handleBulkDelete}>
            Delete Selected ({selectedCampaigns.length})
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
                  checked={selectedCampaigns.length === campaigns.length && campaigns.length > 0}
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
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedCampaigns.includes(campaign.id)}
                    onChange={(e) => handleSelectCampaign(campaign.id, e.target.checked)}
                  />
                </td>
                {columns.map((column) => (
                  <td key={String(column.key)} className="p-4">
                    {String(campaign[column.key as keyof EmailCampaignDisplayData])}
                  </td>
                ))}
                <td className="p-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCampaign(campaign)}
                    >
                      Edit
                    </Button>
                    {campaign.original?.status === 'draft' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSendCampaign(campaign.id)}
                      >
                        Send
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} campaigns
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={currentPage * pageSize >= totalCount}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!editingCampaign}
        onClose={handleCloseModal}
      >
        <ModalHeader>
          {editingCampaign ? 'Edit Email Campaign' : 'Create Email Campaign'}
        </ModalHeader>
        <ModalBody>
          <CampaignForm
            campaign={editingCampaign}
            onSave={handleCampaignSaved}
            onCancel={handleCloseModal}
          />
        </ModalBody>
      </Modal>
    </div>
  );
}