'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { BulkOperations } from '@/components/ui/BulkOperations';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { Testimonial } from '@/types/database';
import { TestimonialForm } from './TestimonialForm';

interface TestimonialDisplayData {
  id: string;
  name: string;
  email: string;
  company: string;
  position: string;
  content: string;
  rating: string;
  status: string;
  featured: string;
  approved_at: string;
  created_at: string;
  // Keep original data for editing
  original?: Testimonial;
}

interface TestimonialsResponse {
  data: Testimonial[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<TestimonialDisplayData[]>([]);
  const [originalTestimonials, setOriginalTestimonials] = useState<Testimonial[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingTestimonial, setViewingTestimonial] = useState<Testimonial | null>(null);
  const [selectedTestimonials, setSelectedTestimonials] = useState<TestimonialDisplayData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const { data, loading, error, request } = useApiRequest<TestimonialsResponse>();

  // Load testimonials
  const loadTestimonials = async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (approvalFilter) params.append('is_approved', approvalFilter);
    if (featuredFilter) params.append('is_featured', featuredFilter);
    if (ratingFilter) params.append('rating', ratingFilter);

    await request(`/api/testimonials?${params.toString()}`);
  };

  useEffect(() => {
    loadTestimonials();
  }, [searchTerm, approvalFilter, featuredFilter, ratingFilter]);

  useEffect(() => {
    if (data?.data) {
      setOriginalTestimonials(data.data);
      // Format data for display
      const formattedTestimonials: TestimonialDisplayData[] = data.data.map(testimonial => ({
        id: testimonial.id,
        name: testimonial.name,
        email: testimonial.email,
        company: testimonial.company || 'N/A',
        position: testimonial.position || 'N/A',
        content: testimonial.content.length > 100 ? testimonial.content.substring(0, 100) + '...' : testimonial.content,
        rating: '★'.repeat(testimonial.rating) + '☆'.repeat(5 - testimonial.rating),
        status: testimonial.is_approved ? 'Approved' : 'Pending',
        featured: testimonial.is_featured ? 'Yes' : 'No',
        approved_at: testimonial.approved_at ? new Date(testimonial.approved_at).toLocaleDateString() : 'N/A',
        created_at: new Date(testimonial.created_at).toLocaleDateString(),
        original: testimonial,
      }));
      setTestimonials(formattedTestimonials);
    }
  }, [data]);

  const handleViewTestimonial = (testimonial: TestimonialDisplayData) => {
    setViewingTestimonial(testimonial.original || null);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setViewingTestimonial(null);
  };

  const handleTestimonialSaved = () => {
    handleCloseModal();
    loadTestimonials(); // Reload testimonials
  };

  const handleSelectionChange = (testimonials: TestimonialDisplayData[]) => {
    setSelectedTestimonials(testimonials);
  };

  const handleClearSelection = () => {
    setSelectedTestimonials([]);
  };

  // Bulk operations
  const handleBulkApprove = async (testimonials: TestimonialDisplayData[], value?: string) => {
    const approve = value === 'true';
    const results = { total: testimonials.length, successful: 0, failed: 0, errors: [] as any[] };

    for (const testimonial of testimonials) {
      try {
        const response = await fetch(`/api/testimonials/${testimonial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_approved: approve })
        });

        if (response.ok) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({ id: testimonial.id, error: 'Failed to update approval status' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ id: testimonial.id, error: 'Network error' });
      }
    }

    if (results.successful > 0) {
      loadTestimonials();
    }

    return results;
  };

  const handleBulkFeature = async (testimonials: TestimonialDisplayData[], value?: string) => {
    const feature = value === 'true';
    const results = { total: testimonials.length, successful: 0, failed: 0, errors: [] as any[] };

    for (const testimonial of testimonials) {
      try {
        const response = await fetch(`/api/testimonials/${testimonial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_featured: feature })
        });

        if (response.ok) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({ id: testimonial.id, error: 'Failed to update featured status' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ id: testimonial.id, error: 'Network error' });
      }
    }

    if (results.successful > 0) {
      loadTestimonials();
    }

    return results;
  };

  const handleBulkDelete = async (testimonials: TestimonialDisplayData[], value?: string) => {
    const results = { total: testimonials.length, successful: 0, failed: 0, errors: [] as any[] };

    for (const testimonial of testimonials) {
      try {
        const response = await fetch(`/api/testimonials/${testimonial.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({ id: testimonial.id, error: 'Failed to delete testimonial' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ id: testimonial.id, error: 'Network error' });
      }
    }

    if (results.successful > 0) {
      loadTestimonials();
    }

    return results;
  };

  const bulkActions = [
    {
      key: 'approve',
      label: 'Approval',
      type: 'status' as const,
      options: [
        { value: 'true', label: 'Approve' },
        { value: 'false', label: 'Reject' }
      ],
      handler: handleBulkApprove,
    },
    {
      key: 'feature',
      label: 'Featured',
      type: 'status' as const,
      options: [
        { value: 'true', label: 'Feature' },
        { value: 'false', label: 'Unfeature' }
      ],
      handler: handleBulkFeature,
    },
    {
      key: 'delete',
      label: 'Delete',
      type: 'delete' as const,
      handler: handleBulkDelete,
      confirmMessage: (count: number) => `Are you sure you want to delete ${count} testimonial${count !== 1 ? 's' : ''}? This action cannot be undone.`,
    },
  ];

  const handleExport = async () => {
    try {
      // Fetch all testimonials for export (remove pagination limit)
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (approvalFilter) params.append('is_approved', approvalFilter);
      if (featuredFilter) params.append('is_featured', featuredFilter);
      if (ratingFilter) params.append('rating', ratingFilter);
      params.append('limit', '10000'); // Large limit to get all

      const response = await fetch(`/api/testimonials?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch testimonials');

      const data = await response.json();
      const testimonials = data.data || [];

      // Convert to CSV
      const headers = ['Name', 'Email', 'Company', 'Position', 'Content', 'Rating', 'Approved', 'Featured', 'Approved At', 'Created At'];
      const csvContent = [
        headers.join(','),
        ...testimonials.map((testimonial: Testimonial) => [
          `"${testimonial.name.replace(/"/g, '""')}"`,
          `"${testimonial.email.replace(/"/g, '""')}"`,
          `"${(testimonial.company || '').replace(/"/g, '""')}"`,
          `"${(testimonial.position || '').replace(/"/g, '""')}"`,
          `"${testimonial.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          testimonial.rating,
          testimonial.is_approved ? 'Yes' : 'No',
          testimonial.is_featured ? 'Yes' : 'No',
          testimonial.approved_at || '',
          new Date(testimonial.created_at).toLocaleString(),
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `testimonials_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting testimonials:', error);
      alert('Error exporting testimonials');
    }
  };

  // Calculate rating analytics
  const ratingAnalytics = originalTestimonials.reduce((acc, testimonial) => {
    if (testimonial.is_approved) {
      acc.total++;
      acc.sum += testimonial.rating;
      acc.distribution[testimonial.rating] = (acc.distribution[testimonial.rating] || 0) + 1;
    }
    return acc;
  }, {
    total: 0,
    sum: 0,
    distribution: {} as Record<number, number>
  });

  const averageRating = ratingAnalytics.total > 0 ? (ratingAnalytics.sum / ratingAnalytics.total).toFixed(1) : '0.0';

  if (loading && testimonials.length === 0) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-primary">Loading testimonials...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="text-red-600">Error loading testimonials: {error}</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Testimonials Management</h1>
          <p className="text-primary text-sm md:text-base">Manage customer testimonials and reviews</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            Export
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Add Testimonial
          </Button>
        </div>
      </div>

      {/* Rating Analytics */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-medium mb-3">Rating Analytics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{averageRating}</div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{ratingAnalytics.total}</div>
            <div className="text-sm text-gray-600">Total Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{ratingAnalytics.distribution[5] || 0}</div>
            <div className="text-sm text-gray-600">5-Star Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">{originalTestimonials.filter(t => t.is_featured).length}</div>
            <div className="text-sm text-gray-600">Featured</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search name, email, company, position, or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <Label htmlFor="approvalStatus">Approval Status</Label>
          <Select
            id="approvalStatus"
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="false">Pending</option>
            <option value="true">Approved</option>
          </Select>
        </div>
        <div className="sm:w-48">
          <Label htmlFor="featuredStatus">Featured Status</Label>
          <Select
            id="featuredStatus"
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="false">Not Featured</option>
            <option value="true">Featured</option>
          </Select>
        </div>
        <div className="sm:w-48">
          <Label htmlFor="rating">Rating</Label>
          <Select
            id="rating"
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </Select>
        </div>
      </div>

      <BulkOperations
        selectedItems={selectedTestimonials}
        onClearSelection={handleClearSelection}
        availableActions={bulkActions}
      />

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="border-b">
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedTestimonials.length === testimonials.length && testimonials.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTestimonials(testimonials);
                    } else {
                      setSelectedTestimonials([]);
                    }
                  }}
                />
              </th>
              <th className="p-4 text-left font-medium">Name</th>
              <th className="p-4 text-left font-medium">Company</th>
              <th className="p-4 text-left font-medium">Content</th>
              <th className="p-4 text-left font-medium">Rating</th>
              <th className="p-4 text-left font-medium">Status</th>
              <th className="p-4 text-left font-medium">Featured</th>
              <th className="p-4 text-left font-medium">Approved</th>
              <th className="p-4 text-left font-medium">Created</th>
              <th className="p-4 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {testimonials.map((testimonial) => (
              <tr key={testimonial.id} className={`border-b hover:bg-gray-50 ${!testimonial.original?.is_approved ? 'bg-yellow-50' : ''}`}>
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedTestimonials.includes(testimonial)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTestimonials(prev => [...prev, testimonial]);
                      } else {
                        setSelectedTestimonials(prev => prev.filter(t => t !== testimonial));
                      }
                    }}
                  />
                </td>
                <td className="p-4">{testimonial.name}</td>
                <td className="p-4">{testimonial.company}</td>
                <td className="p-4">{testimonial.content}</td>
                <td className="p-4 text-yellow-500 font-bold">{testimonial.rating}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${testimonial.original?.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {testimonial.status}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${testimonial.original?.is_featured ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                    {testimonial.featured}
                  </span>
                </td>
                <td className="p-4">{testimonial.approved_at}</td>
                <td className="p-4">{testimonial.created_at}</td>
                <td className="p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewTestimonial(testimonial)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!viewingTestimonial}
        onClose={handleCloseModal}
      >
        <ModalHeader>
          {viewingTestimonial ? 'View/Edit Testimonial' : 'Create Testimonial'}
        </ModalHeader>
        <ModalBody>
          <TestimonialForm
            testimonial={viewingTestimonial}
            onSave={handleTestimonialSaved}
            onCancel={handleCloseModal}
          />
        </ModalBody>
      </Modal>
    </div>
  );
}