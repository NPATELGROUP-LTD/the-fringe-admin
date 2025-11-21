'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
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

  const { data, loading, error, request } = useApiRequest<ServicesResponse>();

  // Load services
  const loadServices = async () => {
    await request('/api/services');
  };

  useEffect(() => {
    loadServices();
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

  const columns: Column<ServiceWithCategory>[] = [
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
  const renderCell = (service: ServiceWithCategory, column: Column<ServiceWithCategory>) => {
    if (column.key === 'service_categories') {
      return service.service_categories?.name || 'No Category';
    }
    if (column.key === 'is_active') {
      return service.is_active ? 'Yes' : 'No';
    }
    if (column.key === 'price') {
      return `$${service.price}`;
    }
    if (column.key === 'created_at') {
      return new Date(service.created_at).toLocaleDateString();
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
        <Button onClick={handleCreateService}>
          Add Service
        </Button>
      </div>

      <DataTable
        data={services as any}
        columns={columns}
        filterable={true}
        filterPlaceholder="Search services..."
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
    </div>
  );
}