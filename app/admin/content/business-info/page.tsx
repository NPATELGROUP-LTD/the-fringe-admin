'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { BusinessInfo } from '@/types/database';
import { BusinessInfoForm } from './BusinessInfoForm';

interface BusinessInfoDisplayData {
  id: string;
  key: string;
  value: string;
  type: string;
  is_active: string;
  created_at: string;
  // Keep original data for editing
  original?: BusinessInfo;
}

interface BusinessInfoResponse {
  data: BusinessInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function BusinessInfoPage() {
  const [businessInfos, setBusinessInfos] = useState<BusinessInfoDisplayData[]>([]);
  const [originalBusinessInfos, setOriginalBusinessInfos] = useState<BusinessInfo[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBusinessInfo, setEditingBusinessInfo] = useState<BusinessInfo | null>(null);
  const [selectedBusinessInfos, setSelectedBusinessInfos] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, loading, error, request } = useApiRequest<BusinessInfoResponse>();

  // Load business info
  const loadBusinessInfos = async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (typeFilter) params.append('type', typeFilter);

    await request(`/api/business-info?${params.toString()}`);
  };

  useEffect(() => {
    loadBusinessInfos();
  }, [searchTerm, typeFilter]);

  useEffect(() => {
    if (data?.data) {
      setOriginalBusinessInfos(data.data);
      // Format data for display
      const formattedBusinessInfos: BusinessInfoDisplayData[] = data.data.map(info => ({
        id: info.id,
        key: info.key,
        value: typeof info.value === 'string' ? info.value : JSON.stringify(info.value),
        type: info.type,
        is_active: info.is_active ? 'Yes' : 'No',
        created_at: new Date(info.created_at).toLocaleDateString(),
        original: info,
      }));
      setBusinessInfos(formattedBusinessInfos);
    }
  }, [data]);

  const handleCreateBusinessInfo = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditBusinessInfo = (info: BusinessInfoDisplayData) => {
    setEditingBusinessInfo(info.original || null);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingBusinessInfo(null);
  };

  const handleBusinessInfoSaved = () => {
    handleCloseModal();
    loadBusinessInfos(); // Reload business infos
  };

  const handleSelectBusinessInfo = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedBusinessInfos(prev => [...prev, id]);
    } else {
      setSelectedBusinessInfos(prev => prev.filter(infoId => infoId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBusinessInfos(businessInfos.map(info => info.id));
    } else {
      setSelectedBusinessInfos([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedBusinessInfos.length) return;

    if (!confirm(`Are you sure you want to delete ${selectedBusinessInfos.length} business info item(s)?`)) return;

    try {
      await Promise.all(
        selectedBusinessInfos.map(id =>
          fetch(`/api/business-info/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedBusinessInfos([]);
      loadBusinessInfos();
    } catch (error) {
      console.error('Error deleting business info:', error);
      alert('Error deleting business info');
    }
  };

  const handleBulkActivate = async (activate: boolean) => {
    if (!selectedBusinessInfos.length) return;

    try {
      await Promise.all(
        selectedBusinessInfos.map(id =>
          fetch(`/api/business-info/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: activate })
          })
        )
      );
      setSelectedBusinessInfos([]);
      loadBusinessInfos();
    } catch (error) {
      console.error('Error updating business info:', error);
      alert('Error updating business info');
    }
  };

  const columns = [
    { key: 'key', label: 'Key', sortable: true },
    { key: 'value', label: 'Value', sortable: false },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'is_active', label: 'Active', sortable: true },
    { key: 'created_at', label: 'Created', sortable: true },
  ];

  if (loading && businessInfos.length === 0) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-primary">Loading business information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="text-red-600">Error loading business information: {error}</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Business Information</h1>
          <p className="text-primary text-sm md:text-base">Manage contact details, hours, and social media links</p>
        </div>
        <Button onClick={handleCreateBusinessInfo}>
          Add Business Info
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search keys and types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <Label htmlFor="type">Type</Label>
          <Select
            id="type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="text">Text</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="address">Address</option>
            <option value="hours">Hours</option>
            <option value="social">Social</option>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedBusinessInfos.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button variant="outline" onClick={() => handleBulkActivate(true)}>
            Activate Selected ({selectedBusinessInfos.length})
          </Button>
          <Button variant="outline" onClick={() => handleBulkActivate(false)}>
            Deactivate Selected ({selectedBusinessInfos.length})
          </Button>
          <Button variant="secondary" onClick={handleBulkDelete}>
            Delete Selected ({selectedBusinessInfos.length})
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
                  checked={selectedBusinessInfos.length === businessInfos.length && businessInfos.length > 0}
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
            {businessInfos.map((info) => (
              <tr key={info.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedBusinessInfos.includes(info.id)}
                    onChange={(e) => handleSelectBusinessInfo(info.id, e.target.checked)}
                  />
                </td>
                {columns.map((column) => (
                  <td key={String(column.key)} className="p-4">
                    {String(info[column.key as keyof BusinessInfoDisplayData])}
                  </td>
                ))}
                <td className="p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditBusinessInfo(info)}
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
        isOpen={isCreateModalOpen || !!editingBusinessInfo}
        onClose={handleCloseModal}
      >
        <ModalHeader>
          {editingBusinessInfo ? 'Edit Business Info' : 'Create Business Info'}
        </ModalHeader>
        <ModalBody>
          <BusinessInfoForm
            businessInfo={editingBusinessInfo}
            onSave={handleBusinessInfoSaved}
            onCancel={handleCloseModal}
          />
        </ModalBody>
      </Modal>
    </div>
  );
}