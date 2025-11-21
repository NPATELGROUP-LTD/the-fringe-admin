'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable, Column, FilterConfig, ActiveFilter } from '@/components/ui/DataTable';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { BulkOperations } from '@/components/ui/BulkOperations';
import { ImportModal } from '@/components/ui/ImportModal';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { Service } from '@/types/database';
import { ServiceForm } from './ServiceForm';

interface ServiceWithCategory extends Service {
  service_categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface ServiceDisplayData {
  id: string;
  title: string;
  slug: string;
  price: string;
  duration: string;
  service_categories: string;
  is_active: string;
  created_at: string;
  // Keep original data for editing
  original?: ServiceWithCategory;
}

interface ServicesResponse {
  data: ServiceWithCategory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceDisplayData[]>([]);
  const [originalServices, setOriginalServices] = useState<ServiceWithCategory[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceWithCategory | null>(null);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [selectedServices, setSelectedServices] = useState<ServiceDisplayData[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { data, loading, error, request } = useApiRequest<ServicesResponse>();

  // Load services
  const loadServices = async () => {
    await request('/api/services');
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/service-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  useEffect(() => {
    loadServices();
    loadCategories();
  }, []);

  useEffect(() => {
    if (data?.data) {
      setOriginalServices(data.data);
      // Format data for display
      const formattedServices: ServiceDisplayData[] = data.data.map(service => ({
        id: service.id,
        title: service.title,
        slug: service.slug,
        price: `$${service.price}`,
        duration: `${service.duration} min`,
        service_categories: service.service_categories?.name || 'No Category',
        is_active: service.is_active ? 'Yes' : 'No',
        created_at: new Date(service.created_at).toLocaleDateString(),
        original: service,
      }));
      setServices(formattedServices);
    }
  }, [data]);

  const handleCreateService = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditService = (service: ServiceDisplayData) => {
    setEditingService(service.original || null);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingService(null);
  };

  const handleServiceSaved = () => {
    handleCloseModal();
    loadServices(); // Reload services
  };

  const handleFiltersChange = (filters: ActiveFilter[]) => {
    setActiveFilters(filters);
  };

  const handleSelectionChange = (services: ServiceDisplayData[]) => {
    setSelectedServices(services);
  };

  const handleClearSelection = () => {
    setSelectedServices([]);
  };

  const handleImportComplete = () => {
    loadServices();
    setIsImportModalOpen(false);
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/services/export');
      if (!response.ok) throw new Error('Failed to export services');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `services_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting services:', error);
      alert('Error exporting services');
    }
  };

  // Bulk operations
  const handleBulkStatusChange = async (services: ServiceDisplayData[], value?: string) => {
    const results = { total: services.length, successful: 0, failed: 0, errors: [] as any[] };

    for (const service of services) {
      try {
        const response = await fetch(`/api/services/${service.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: value === 'true' })
        });

        if (response.ok) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({ id: service.id, error: 'Failed to update status' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ id: service.id, error: 'Network error' });
      }
    }

    if (results.successful > 0) {
      loadServices();
    }

    return results;
  };

  const handleBulkCategoryChange = async (services: ServiceDisplayData[], value?: string) => {
    const results = { total: services.length, successful: 0, failed: 0, errors: [] as any[] };

    for (const service of services) {
      try {
        const response = await fetch(`/api/services/${service.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category_id: value })
        });

        if (response.ok) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({ id: service.id, error: 'Failed to update category' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ id: service.id, error: 'Network error' });
      }
    }

    if (results.successful > 0) {
      loadServices();
    }

    return results;
  };

  const handleBulkDelete = async (services: ServiceDisplayData[], value?: string) => {
    const results = { total: services.length, successful: 0, failed: 0, errors: [] as any[] };

    for (const service of services) {
      try {
        const response = await fetch(`/api/services/${service.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({ id: service.id, error: 'Failed to delete service' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ id: service.id, error: 'Network error' });
      }
    }

    if (results.successful > 0) {
      loadServices();
    }

    return results;
  };

  const bulkActions = [
    {
      key: 'status',
      label: 'Status',
      type: 'status' as const,
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ],
      handler: handleBulkStatusChange,
    },
    {
      key: 'category',
      label: 'Category',
      type: 'category' as const,
      options: categories.map(cat => ({ value: cat.id, label: cat.name })),
      handler: handleBulkCategoryChange,
    },
    {
      key: 'delete',
      label: 'Delete',
      type: 'delete' as const,
      handler: handleBulkDelete,
      confirmMessage: (count: number) => `Are you sure you want to delete ${count} service${count !== 1 ? 's' : ''}? This action cannot be undone.`,
    },
  ];

  const filters: FilterConfig[] = [
    {
      key: 'category_id',
      label: 'Category',
      type: 'select',
      options: categories.map(cat => ({ value: cat.id, label: cat.name })),
      placeholder: 'All Categories'
    },
    {
      key: 'is_active',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ],
      placeholder: 'All Status'
    }
  ];

  const columns: Column<ServiceDisplayData>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
    },
    {
      key: 'slug',
      label: 'Slug',
      sortable: true,
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
    },
    {
      key: 'duration',
      label: 'Duration (min)',
      sortable: true,
    },
    {
      key: 'service_categories',
      label: 'Category',
      sortable: false,
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

  // Custom render function for category column
  const renderCell = (service: ServiceDisplayData, column: Column<ServiceDisplayData>) => {
    if (column.key === 'service_categories') {
      return service.service_categories || 'No Category';
    }
    if (column.key === 'is_active') {
      return service.is_active;
    }
    if (column.key === 'price') {
      return service.price;
    }
    if (column.key === 'created_at') {
      return service.created_at;
    }
    return String(service[column.key]);
  };

  if (loading && services.length === 0) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-primary">Loading services...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="text-red-600">Error loading services: {error}</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Services</h1>
          <p className="text-primary text-sm md:text-base">Manage your service offerings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleExport}>
            Export CSV
          </Button>
          <Button onClick={handleCreateService}>
            Add Service
          </Button>
        </div>
      </div>

      <BulkOperations
        selectedItems={selectedServices}
        onClearSelection={handleClearSelection}
        availableActions={bulkActions}
      />

      <DataTable
        data={services as any}
        columns={columns}
        filterable={true}
        filterPlaceholder="Search services..."
        filters={filters}
        activeFilters={activeFilters}
        onFiltersChange={handleFiltersChange}
        selectable={true}
        selectedItems={selectedServices}
        onSelectionChange={handleSelectionChange}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!editingService}
        onClose={handleCloseModal}
      >
        <ModalHeader>
          {editingService ? 'Edit Service' : 'Create Service'}
        </ModalHeader>
        <ModalBody>
          <ServiceForm
            service={editingService}
            onSave={handleServiceSaved}
            onCancel={handleCloseModal}
          />
        </ModalBody>
      </Modal>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
        title="Services"
        apiEndpoint="/api/services/import"
        csvTemplate="title,slug,description,price,duration,category_id,is_active
Web Design Service,web-design,Professional web design services,299.99,240,service-category-uuid,true
SEO Optimization,seo-optimization,Improve your search engine rankings,199.99,120,service-category-uuid,true"
        requiredFields={['title', 'slug', 'price', 'duration']}
        optionalFields={['description', 'category_id', 'is_active']}
        fieldDescriptions={{
          title: 'Service title',
          slug: 'URL-friendly identifier',
          description: 'Service description',
          price: 'Service price in dollars',
          duration: 'Duration in minutes',
          category_id: 'Category UUID',
          is_active: 'true or false'
        }}
      />
    </div>
  );
}