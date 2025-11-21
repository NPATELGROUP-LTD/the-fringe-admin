'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { CourseCategory, ServiceCategory } from '@/types/database';
import { CategoryForm } from './CategoryForm';

interface CategoryDisplayData {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: string;
  is_active: string;
  created_at: string;
  // Keep original data for editing
  original?: CourseCategory | ServiceCategory;
}

interface CategoriesResponse {
  data: (CourseCategory | ServiceCategory)[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type CategoryType = 'courses' | 'services';

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<CategoryType>('courses');
  const [categories, setCategories] = useState<CategoryDisplayData[]>([]);
  const [originalCategories, setOriginalCategories] = useState<(CourseCategory | ServiceCategory)[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CourseCategory | ServiceCategory | null>(null);

  const { data, loading, error, request } = useApiRequest<CategoriesResponse>();

  // Load categories based on active tab
  const loadCategories = async () => {
    const endpoint = activeTab === 'courses' ? '/api/categories' : '/api/service-categories';
    await request(endpoint);
  };

  useEffect(() => {
    loadCategories();
  }, [activeTab]);

  useEffect(() => {
    if (data?.data) {
      setOriginalCategories(data.data);
      // Format data for display
      const formattedCategories: CategoryDisplayData[] = data.data.map(category => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description || '',
        sort_order: category.sort_order.toString(),
        is_active: category.is_active ? 'Yes' : 'No',
        created_at: new Date(category.created_at).toLocaleDateString(),
        original: category,
      }));
      setCategories(formattedCategories);
    }
  }, [data]);

  const handleCreateCategory = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditCategory = (category: CategoryDisplayData) => {
    setEditingCategory(category.original || null);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingCategory(null);
  };

  const handleCategorySaved = () => {
    handleCloseModal();
    loadCategories(); // Reload categories
  };

  const columns: Column<CourseCategory | ServiceCategory>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
    },
    {
      key: 'slug',
      label: 'Slug',
      sortable: true,
    },
    {
      key: 'description',
      label: 'Description',
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

  // Custom render function for description column
  const renderCell = (category: CourseCategory | ServiceCategory, column: Column<CourseCategory | ServiceCategory>) => {
    if (column.key === 'description') {
      return category.description || 'No description';
    }
    if (column.key === 'is_active') {
      return category.is_active ? 'Yes' : 'No';
    }
    if (column.key === 'created_at') {
      return new Date(category.created_at).toLocaleDateString();
    }
    return String(category[column.key]);
  };

  if (loading && categories.length === 0) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-primary">Loading categories...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="text-red-600">Error loading categories: {error}</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Categories</h1>
          <p className="text-primary text-sm md:text-base">Manage course and service categories</p>
        </div>
        <Button onClick={handleCreateCategory}>
          Add Category
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('courses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'courses'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Course Categories
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'services'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Service Categories
            </button>
          </nav>
        </div>
      </div>

      <DataTable
        data={categories as any}
        columns={columns}
        filterable={true}
        filterPlaceholder="Search categories..."
        onEdit={handleEditCategory}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!editingCategory}
        onClose={handleCloseModal}
      >
        <ModalHeader>
          {editingCategory ? 'Edit Category' : `Create ${activeTab === 'courses' ? 'Course' : 'Service'} Category`}
        </ModalHeader>
        <ModalBody>
          <CategoryForm
            category={editingCategory}
            categoryType={activeTab}
            onSave={handleCategorySaved}
            onCancel={handleCloseModal}
          />
        </ModalBody>
      </Modal>
    </div>
  );
}