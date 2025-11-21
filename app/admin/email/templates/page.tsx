'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { EmailTemplate } from '@/types/database';
import { EmailTemplateForm } from './EmailTemplateForm';

interface EmailTemplateDisplayData {
  id: string;
  name: string;
  subject: string;
  category: string;
  is_active: string;
  created_at: string;
  // Keep original data for editing
  original?: EmailTemplate;
}

interface EmailTemplatesResponse {
  data: EmailTemplate[];
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplateDisplayData[]>([]);
  const [originalTemplates, setOriginalTemplates] = useState<EmailTemplate[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const { data, loading, error, request } = useApiRequest<EmailTemplatesResponse>();

  // Load email templates
  const loadTemplates = async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (categoryFilter) params.append('category', categoryFilter);

    await request(`/api/newsletter/templates?${params.toString()}`);
  };

  useEffect(() => {
    loadTemplates();
  }, [searchTerm, categoryFilter]);

  useEffect(() => {
    if (data?.data) {
      setOriginalTemplates(data.data);
      // Format data for display
      const formattedTemplates: EmailTemplateDisplayData[] = data.data.map(template => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        category: template.category || 'General',
        is_active: template.is_active ? 'Yes' : 'No',
        created_at: new Date(template.created_at).toLocaleDateString(),
        original: template,
      }));
      setTemplates(formattedTemplates);

      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data.data.map(template => template.category).filter((cat): cat is string => Boolean(cat))));
      setCategories(uniqueCategories);
    }
  }, [data]);

  const handleCreateTemplate = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplateDisplayData) => {
    setEditingTemplate(template.original || null);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingTemplate(null);
  };

  const handleTemplateSaved = () => {
    handleCloseModal();
    loadTemplates(); // Reload templates
  };

  const handleSelectTemplate = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTemplates(prev => [...prev, id]);
    } else {
      setSelectedTemplates(prev => prev.filter(templateId => templateId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTemplates(templates.map(template => template.id));
    } else {
      setSelectedTemplates([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedTemplates.length) return;

    if (!confirm(`Are you sure you want to delete ${selectedTemplates.length} template(s)?`)) return;

    try {
      await Promise.all(
        selectedTemplates.map(id =>
          fetch(`/api/newsletter/templates/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedTemplates([]);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting templates:', error);
      alert('Error deleting templates');
    }
  };

  const handleBulkActivate = async (activate: boolean) => {
    if (!selectedTemplates.length) return;

    try {
      await Promise.all(
        selectedTemplates.map(id =>
          fetch(`/api/newsletter/templates/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: activate })
          })
        )
      );
      setSelectedTemplates([]);
      loadTemplates();
    } catch (error) {
      console.error('Error updating templates:', error);
      alert('Error updating templates');
    }
  };

  const columns: Column<EmailTemplateDisplayData>[] = [
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
      key: 'category',
      label: 'Category',
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

  if (loading && templates.length === 0) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-primary">Loading email templates...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="text-red-600">Error loading email templates: {error}</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Email Templates</h1>
          <p className="text-primary text-sm md:text-base">Create and manage reusable email templates</p>
        </div>
        <Button onClick={handleCreateTemplate}>
          Create Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTemplates.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button variant="outline" onClick={() => handleBulkActivate(true)}>
            Activate Selected ({selectedTemplates.length})
          </Button>
          <Button variant="outline" onClick={() => handleBulkActivate(false)}>
            Deactivate Selected ({selectedTemplates.length})
          </Button>
          <Button variant="secondary" onClick={handleBulkDelete}>
            Delete Selected ({selectedTemplates.length})
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
                  checked={selectedTemplates.length === templates.length && templates.length > 0}
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
            {templates.map((template) => (
              <tr key={template.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedTemplates.includes(template.id)}
                    onChange={(e) => handleSelectTemplate(template.id, e.target.checked)}
                  />
                </td>
                {columns.map((column) => (
                  <td key={String(column.key)} className="p-4">
                    {String(template[column.key as keyof EmailTemplateDisplayData])}
                  </td>
                ))}
                <td className="p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
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
        isOpen={isCreateModalOpen || !!editingTemplate}
        onClose={handleCloseModal}
      >
        <ModalHeader>
          {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
        </ModalHeader>
        <ModalBody>
          <EmailTemplateForm
            template={editingTemplate}
            onSave={handleTemplateSaved}
            onCancel={handleCloseModal}
          />
        </ModalBody>
      </Modal>
    </div>
  );
}