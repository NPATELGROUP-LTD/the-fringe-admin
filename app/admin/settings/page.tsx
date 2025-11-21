'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { SiteSetting } from '@/types/database';
import { SiteSettingsForm } from './SiteSettingsForm';

interface SiteSettingsResponse {
  data: SiteSetting[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const SETTING_TYPES = ['string', 'number', 'boolean', 'json'];
const SETTING_CATEGORIES = [
  'General',
  'Email',
  'SEO',
  'Social Media',
  'Analytics',
  'Payment',
  'Development',
  'Production',
  'Staging',
];

export default function AdminSettings() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SiteSetting | null>(null);
  const [selectedSettings, setSelectedSettings] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [publicFilter, setPublicFilter] = useState('');

  const { data, loading, error, request } = useApiRequest<SiteSettingsResponse>();

  // Load settings
  const loadSettings = async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (categoryFilter) params.append('category', categoryFilter);
    if (typeFilter) params.append('type', typeFilter);
    if (publicFilter) params.append('is_public', publicFilter);

    await request(`/api/site-settings?${params.toString()}`);
  };

  useEffect(() => {
    loadSettings();
  }, [searchTerm, categoryFilter, typeFilter, publicFilter]);

  useEffect(() => {
    if (data?.data) {
      setSettings(data.data);
    }
  }, [data]);

  const handleCreateSetting = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditSetting = (setting: SiteSetting) => {
    setEditingSetting(setting);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingSetting(null);
  };

  const handleSettingSaved = () => {
    handleCloseModal();
    loadSettings(); // Reload settings
  };

  const handleSelectSetting = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedSettings(prev => [...prev, id]);
    } else {
      setSelectedSettings(prev => prev.filter(settingId => settingId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSettings(settings.map(setting => setting.id));
    } else {
      setSelectedSettings([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedSettings.length) return;

    if (!confirm(`Are you sure you want to delete ${selectedSettings.length} setting(s)?`)) return;

    try {
      await Promise.all(
        selectedSettings.map(id =>
          fetch(`/api/site-settings/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedSettings([]);
      loadSettings();
    } catch (error) {
      console.error('Error deleting settings:', error);
      alert('Error deleting settings');
    }
  };

  const formatValue = (setting: SiteSetting) => {
    const { value, type } = setting;
    if (type === 'json') {
      return JSON.stringify(value);
    }
    if (type === 'boolean') {
      return value ? 'True' : 'False';
    }
    return String(value);
  };

  if (loading && settings.length === 0) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-primary">Loading settings...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="text-red-600">Error loading settings: {error}</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Site Settings</h1>
          <p className="text-primary text-sm md:text-base">Manage site-wide configuration settings</p>
        </div>
        <Button onClick={handleCreateSetting}>
          Add Setting
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search keys and descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {SETTING_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="type">Type</Label>
          <Select
            id="type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {SETTING_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="public">Visibility</Label>
          <Select
            id="public"
            value={publicFilter}
            onChange={(e) => setPublicFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="true">Public</option>
            <option value="false">Private</option>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedSettings.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button variant="secondary" onClick={handleBulkDelete}>
            Delete Selected ({selectedSettings.length})
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSettings.length === settings.length && settings.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="p-4 text-left font-medium">Key</th>
                <th className="p-4 text-left font-medium">Value</th>
                <th className="p-4 text-left font-medium">Type</th>
                <th className="p-4 text-left font-medium">Category</th>
                <th className="p-4 text-left font-medium">Public</th>
                <th className="p-4 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => (
                <tr key={setting.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedSettings.includes(setting.id)}
                      onChange={(e) => handleSelectSetting(setting.id, e.target.checked)}
                    />
                  </td>
                  <td className="p-4 font-medium">{setting.key}</td>
                  <td className="p-4 max-w-xs truncate" title={formatValue(setting)}>
                    {formatValue(setting)}
                  </td>
                  <td className="p-4 capitalize">{setting.type}</td>
                  <td className="p-4">{setting.category}</td>
                  <td className="p-4">{setting.is_public ? 'Yes' : 'No'}</td>
                  <td className="p-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditSetting(setting)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {settings.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No settings found. Create your first setting to get started.
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!editingSetting}
        onClose={handleCloseModal}
      >
        <ModalHeader>
          {editingSetting ? 'Edit Setting' : 'Create Setting'}
        </ModalHeader>
        <ModalBody>
          <SiteSettingsForm
            setting={editingSetting}
            onSave={handleSettingSaved}
            onCancel={handleCloseModal}
          />
        </ModalBody>
      </Modal>
    </div>
  );
}