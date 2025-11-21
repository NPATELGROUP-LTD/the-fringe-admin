'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { BulkOperations } from '@/components/ui/BulkOperations';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { Offer } from '@/types/database';
import { OfferForm } from './OfferForm';

interface OfferDisplayData {
  id: string;
  title: string;
  discount_type: string;
  discount_value: string;
  valid_from: string;
  valid_until: string;
  usage_limit: string;
  usage_count: string;
  is_active: string;
  created_at: string;
  // Keep original data for editing
  original?: Offer;
}

interface OffersResponse {
  data: Offer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function OffersPage() {
  const [offers, setOffers] = useState<OfferDisplayData[]>([]);
  const [originalOffers, setOriginalOffers] = useState<Offer[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [selectedOffers, setSelectedOffers] = useState<OfferDisplayData[]>([]);

  const { data, loading, error, request } = useApiRequest<OffersResponse>();

  // Load offers
  const loadOffers = async () => {
    await request('/api/offers');
  };

  useEffect(() => {
    loadOffers();
  }, []);

  useEffect(() => {
    if (data?.data) {
      setOriginalOffers(data.data);
      // Format data for display
      const formattedOffers: OfferDisplayData[] = data.data.map(offer => ({
        id: offer.id,
        title: offer.title,
        discount_type: offer.discount_type,
        discount_value: offer.discount_type === 'percentage'
          ? `${offer.discount_value}%`
          : `$${offer.discount_value}`,
        valid_from: new Date(offer.valid_from).toLocaleDateString(),
        valid_until: new Date(offer.valid_until).toLocaleDateString(),
        usage_limit: offer.usage_limit ? offer.usage_limit.toString() : 'Unlimited',
        usage_count: offer.usage_count.toString(),
        is_active: offer.is_active ? 'Yes' : 'No',
        created_at: new Date(offer.created_at).toLocaleDateString(),
        original: offer,
      }));
      setOffers(formattedOffers);
    }
  }, [data]);

  const handleCreateOffer = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditOffer = (offer: OfferDisplayData) => {
    setEditingOffer(offer.original || null);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingOffer(null);
  };

  const handleOfferSaved = () => {
    handleCloseModal();
    loadOffers(); // Reload offers
  };

  const handleSelectionChange = (offers: OfferDisplayData[]) => {
    setSelectedOffers(offers);
  };

  const handleClearSelection = () => {
    setSelectedOffers([]);
  };

  // Bulk operations
  const handleBulkStatusChange = async (offers: OfferDisplayData[], value?: string) => {
    const activate = value === 'true';
    const results = { total: offers.length, successful: 0, failed: 0, errors: [] as any[] };

    for (const offer of offers) {
      try {
        const response = await fetch(`/api/offers/${offer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: activate })
        });

        if (response.ok) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({ id: offer.id, error: 'Failed to update status' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ id: offer.id, error: 'Network error' });
      }
    }

    if (results.successful > 0) {
      loadOffers();
    }

    return results;
  };

  const handleBulkDelete = async (offers: OfferDisplayData[], value?: string) => {
    const results = { total: offers.length, successful: 0, failed: 0, errors: [] as any[] };

    for (const offer of offers) {
      try {
        const response = await fetch(`/api/offers/${offer.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({ id: offer.id, error: 'Failed to delete offer' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ id: offer.id, error: 'Network error' });
      }
    }

    if (results.successful > 0) {
      loadOffers();
    }

    return results;
  };

  const bulkActions = [
    {
      key: 'status',
      label: 'Status',
      type: 'status' as const,
      options: [
        { value: 'true', label: 'Activate' },
        { value: 'false', label: 'Deactivate' }
      ],
      handler: handleBulkStatusChange,
    },
    {
      key: 'delete',
      label: 'Delete',
      type: 'delete' as const,
      handler: handleBulkDelete,
      confirmMessage: (count: number) => `Are you sure you want to delete ${count} offer${count !== 1 ? 's' : ''}? This action cannot be undone.`,
    },
  ];

  const columns: Column<OfferDisplayData>[] = [
    {
      key: 'title',
      label: 'Title',
      sortable: true,
    },
    {
      key: 'discount_type',
      label: 'Type',
      sortable: true,
    },
    {
      key: 'discount_value',
      label: 'Discount',
      sortable: true,
    },
    {
      key: 'valid_from',
      label: 'Valid From',
      sortable: true,
    },
    {
      key: 'valid_until',
      label: 'Valid Until',
      sortable: true,
    },
    {
      key: 'usage_limit',
      label: 'Usage Limit',
      sortable: false,
    },
    {
      key: 'usage_count',
      label: 'Used',
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

  // Custom render function for columns
  const renderCell = (offer: OfferDisplayData, column: Column<OfferDisplayData>) => {
    if (column.key === 'discount_value') {
      return offer.discount_value;
    }
    if (column.key === 'valid_from' || column.key === 'valid_until') {
      return offer[column.key];
    }
    if (column.key === 'usage_limit') {
      return offer.usage_limit;
    }
    if (column.key === 'is_active') {
      return offer.is_active;
    }
    if (column.key === 'created_at') {
      return offer.created_at;
    }
    return String(offer[column.key]);
  };

  if (loading && offers.length === 0) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-primary">Loading offers...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="text-red-600">Error loading offers: {error}</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Offers</h1>
          <p className="text-primary text-sm md:text-base">Manage discount offers and promotions</p>
        </div>
        <Button onClick={handleCreateOffer}>
          Add Offer
        </Button>
      </div>

      <BulkOperations
        selectedItems={selectedOffers}
        onClearSelection={handleClearSelection}
        availableActions={bulkActions}
      />

      <DataTable
        data={offers as any}
        columns={columns}
        filterable={true}
        filterPlaceholder="Search offers..."
        selectable={true}
        selectedItems={selectedOffers}
        onSelectionChange={handleSelectionChange}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!editingOffer}
        onClose={handleCloseModal}
      >
        <ModalHeader>
          {editingOffer ? 'Edit Offer' : 'Create Offer'}
        </ModalHeader>
        <ModalBody>
          <OfferForm
            offer={editingOffer}
            onSave={handleOfferSaved}
            onCancel={handleCloseModal}
          />
        </ModalBody>
      </Modal>
    </div>
  );
}