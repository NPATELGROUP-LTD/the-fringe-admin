'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { FAQ } from '@/types/database';
import { FAQForm } from './FAQForm';

interface FAQDisplayData {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: string;
  is_active: string;
  created_at: string;
  // Keep original data for editing
  original?: FAQ;
}

interface FAQsResponse {
  data: FAQ[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQDisplayData[]>([]);
  const [originalFaqs, setOriginalFaqs] = useState<FAQ[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [selectedFAQs, setSelectedFAQs] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  const { data, loading, error, request } = useApiRequest<FAQsResponse>();

  // Load FAQs
  const loadFAQs = async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (categoryFilter) params.append('category', categoryFilter);

    await request(`/api/faqs?${params.toString()}`);
  };

  useEffect(() => {
    loadFAQs();
  }, [searchTerm, categoryFilter]);

  useEffect(() => {
    if (data?.data) {
      setOriginalFaqs(data.data);
      // Format data for display
      const formattedFAQs: FAQDisplayData[] = data.data.map(faq => ({
        id: faq.id,
        category: faq.category || 'General',
        question: faq.question,
        answer: faq.answer.length > 100 ? faq.answer.substring(0, 100) + '...' : faq.answer,
        sort_order: faq.sort_order.toString(),
        is_active: faq.is_active ? 'Yes' : 'No',
        created_at: new Date(faq.created_at).toLocaleDateString(),
        original: faq,
      }));
      setFaqs(formattedFAQs);

      // Extract unique categories
      const uniqueCategories = Array.from(new Set(data.data.map(faq => faq.category).filter((cat): cat is string => Boolean(cat))));
      setCategories(uniqueCategories);
    }
  }, [data]);

  const handleCreateFAQ = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditFAQ = (faq: FAQDisplayData) => {
    setEditingFAQ(faq.original || null);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingFAQ(null);
  };

  const handleFAQSaved = () => {
    handleCloseModal();
    loadFAQs(); // Reload FAQs
  };

  const handleSelectFAQ = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedFAQs(prev => [...prev, id]);
    } else {
      setSelectedFAQs(prev => prev.filter(faqId => faqId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFAQs(faqs.map(faq => faq.id));
    } else {
      setSelectedFAQs([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedFAQs.length) return;

    if (!confirm(`Are you sure you want to delete ${selectedFAQs.length} FAQ(s)?`)) return;

    try {
      await Promise.all(
        selectedFAQs.map(id =>
          fetch(`/api/faqs/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedFAQs([]);
      loadFAQs();
    } catch (error) {
      console.error('Error deleting FAQs:', error);
      alert('Error deleting FAQs');
    }
  };

  const handleBulkActivate = async (activate: boolean) => {
    if (!selectedFAQs.length) return;

    try {
      await Promise.all(
        selectedFAQs.map(id =>
          fetch(`/api/faqs/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: activate })
          })
        )
      );
      setSelectedFAQs([]);
      loadFAQs();
    } catch (error) {
      console.error('Error updating FAQs:', error);
      alert('Error updating FAQs');
    }
  };

  const columns: Column<FAQDisplayData>[] = [
    {
      key: 'category',
      label: 'Category',
      sortable: true,
    },
    {
      key: 'question',
      label: 'Question',
      sortable: true,
    },
    {
      key: 'answer',
      label: 'Answer',
      sortable: false,
    },
    {
      key: 'sort_order',
      label: 'Sort Order',
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

  if (loading && faqs.length === 0) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-primary">Loading FAQs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="text-red-600">Error loading FAQs: {error}</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">FAQs</h1>
          <p className="text-primary text-sm md:text-base">Manage frequently asked questions</p>
        </div>
        <Button onClick={handleCreateFAQ}>
          Add FAQ
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search questions and answers..."
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
      {selectedFAQs.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button variant="outline" onClick={() => handleBulkActivate(true)}>
            Activate Selected ({selectedFAQs.length})
          </Button>
          <Button variant="outline" onClick={() => handleBulkActivate(false)}>
            Deactivate Selected ({selectedFAQs.length})
          </Button>
          <Button variant="secondary" onClick={handleBulkDelete}>
            Delete Selected ({selectedFAQs.length})
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
                  checked={selectedFAQs.length === faqs.length && faqs.length > 0}
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
            {faqs.map((faq) => (
              <tr key={faq.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedFAQs.includes(faq.id)}
                    onChange={(e) => handleSelectFAQ(faq.id, e.target.checked)}
                  />
                </td>
                {columns.map((column) => (
                  <td key={String(column.key)} className="p-4">
                    {String(faq[column.key as keyof FAQDisplayData])}
                  </td>
                ))}
                <td className="p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditFAQ(faq)}
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
        isOpen={isCreateModalOpen || !!editingFAQ}
        onClose={handleCloseModal}
      >
        <ModalHeader>
          {editingFAQ ? 'Edit FAQ' : 'Create FAQ'}
        </ModalHeader>
        <ModalBody>
          <FAQForm
            faq={editingFAQ}
            onSave={handleFAQSaved}
            onCancel={handleCloseModal}
          />
        </ModalBody>
      </Modal>
    </div>
  );
}