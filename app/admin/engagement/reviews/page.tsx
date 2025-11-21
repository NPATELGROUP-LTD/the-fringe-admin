'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { Review } from '@/types/database';
import { ReviewForm } from './ReviewForm';

interface ReviewDisplayData {
  id: string;
  name: string;
  email: string;
  title: string;
  content: string;
  rating: string;
  course_id: string;
  status: string;
  approved_at: string;
  response: string;
  created_at: string;
  // Keep original data for editing
  original?: Review;
}

interface ReviewsResponse {
  data: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewDisplayData[]>([]);
  const [originalReviews, setOriginalReviews] = useState<Review[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingReview, setViewingReview] = useState<Review | null>(null);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const { data, loading, error, request } = useApiRequest<ReviewsResponse>();

  // Load reviews
  const loadReviews = async () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (approvalFilter) params.append('is_approved', approvalFilter);
    if (ratingFilter) params.append('rating', ratingFilter);

    await request(`/api/reviews?${params.toString()}`);
  };

  useEffect(() => {
    loadReviews();
  }, [searchTerm, approvalFilter, ratingFilter]);

  useEffect(() => {
    if (data?.data) {
      setOriginalReviews(data.data);
      // Format data for display
      const formattedReviews: ReviewDisplayData[] = data.data.map(review => ({
        id: review.id,
        name: review.name,
        email: review.email,
        title: review.title,
        content: review.content.length > 100 ? review.content.substring(0, 100) + '...' : review.content,
        rating: '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating),
        course_id: review.course_id || 'N/A',
        status: review.is_approved ? 'Approved' : 'Pending',
        approved_at: review.approved_at ? new Date(review.approved_at).toLocaleDateString() : 'N/A',
        response: review.response ? (review.response.length > 50 ? review.response.substring(0, 50) + '...' : review.response) : 'No response',
        created_at: new Date(review.created_at).toLocaleDateString(),
        original: review,
      }));
      setReviews(formattedReviews);
    }
  }, [data]);

  const handleViewReview = (review: ReviewDisplayData) => {
    setViewingReview(review.original || null);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setViewingReview(null);
  };

  const handleReviewSaved = () => {
    handleCloseModal();
    loadReviews(); // Reload reviews
  };

  const handleSelectReview = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedReviews(prev => [...prev, id]);
    } else {
      setSelectedReviews(prev => prev.filter(reviewId => reviewId !== id));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReviews(reviews.map(review => review.id));
    } else {
      setSelectedReviews([]);
    }
  };

  const handleBulkApprove = async (approve: boolean) => {
    if (!selectedReviews.length) return;

    try {
      await Promise.all(
        selectedReviews.map(id =>
          fetch(`/api/reviews/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_approved: approve })
          })
        )
      );
      setSelectedReviews([]);
      loadReviews();
    } catch (error) {
      console.error('Error updating reviews:', error);
      alert('Error updating reviews');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedReviews.length) return;

    if (!confirm(`Are you sure you want to delete ${selectedReviews.length} review(s)?`)) return;

    try {
      await Promise.all(
        selectedReviews.map(id =>
          fetch(`/api/reviews/${id}`, { method: 'DELETE' })
        )
      );
      setSelectedReviews([]);
      loadReviews();
    } catch (error) {
      console.error('Error deleting reviews:', error);
      alert('Error deleting reviews');
    }
  };

  const handleExport = async () => {
    try {
      // Fetch all reviews for export (remove pagination limit)
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (approvalFilter) params.append('is_approved', approvalFilter);
      if (ratingFilter) params.append('rating', ratingFilter);
      params.append('limit', '10000'); // Large limit to get all

      const response = await fetch(`/api/reviews?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch reviews');

      const data = await response.json();
      const reviews = data.data || [];

      // Convert to CSV
      const headers = ['Name', 'Email', 'Title', 'Content', 'Rating', 'Course ID', 'Approved', 'Approved At', 'Response', 'Responded At', 'Created At'];
      const csvContent = [
        headers.join(','),
        ...reviews.map((review: Review) => [
          `"${review.name.replace(/"/g, '""')}"`,
          `"${review.email.replace(/"/g, '""')}"`,
          `"${review.title.replace(/"/g, '""')}"`,
          `"${review.content.replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          review.rating,
          `"${review.course_id || ''}"`,
          review.is_approved ? 'Yes' : 'No',
          review.approved_at || '',
          `"${(review.response || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`,
          review.responded_at || '',
          new Date(review.created_at).toLocaleString(),
        ].join(','))
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reviews_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting reviews:', error);
      alert('Error exporting reviews');
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-primary">Loading reviews...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="text-red-600">Error loading reviews: {error}</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Reviews Management</h1>
          <p className="text-primary text-sm md:text-base">Manage customer reviews and testimonials</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            Export
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Add Review
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search name, email, title, or content..."
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

      {/* Bulk Actions */}
      {selectedReviews.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button variant="outline" onClick={() => handleBulkApprove(true)}>
            Approve ({selectedReviews.length})
          </Button>
          <Button variant="outline" onClick={() => handleBulkApprove(false)}>
            Reject ({selectedReviews.length})
          </Button>
          <Button variant="secondary" onClick={handleBulkDelete}>
            Delete Selected ({selectedReviews.length})
          </Button>
        </div>
      )}

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="border-b">
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedReviews.length === reviews.length && reviews.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="p-4 text-left font-medium">Name</th>
              <th className="p-4 text-left font-medium">Email</th>
              <th className="p-4 text-left font-medium">Title</th>
              <th className="p-4 text-left font-medium">Content</th>
              <th className="p-4 text-left font-medium">Rating</th>
              <th className="p-4 text-left font-medium">Status</th>
              <th className="p-4 text-left font-medium">Approved</th>
              <th className="p-4 text-left font-medium">Response</th>
              <th className="p-4 text-left font-medium">Created</th>
              <th className="p-4 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className={`border-b hover:bg-gray-50 ${!review.original?.is_approved ? 'bg-yellow-50' : ''}`}>
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedReviews.includes(review.id)}
                    onChange={(e) => handleSelectReview(review.id, e.target.checked)}
                  />
                </td>
                <td className="p-4">{review.name}</td>
                <td className="p-4">{review.email}</td>
                <td className="p-4">{review.title}</td>
                <td className="p-4">{review.content}</td>
                <td className="p-4 text-yellow-500 font-bold">{review.rating}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${review.original?.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {review.status}
                  </span>
                </td>
                <td className="p-4">{review.approved_at}</td>
                <td className="p-4">{review.response}</td>
                <td className="p-4">{review.created_at}</td>
                <td className="p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewReview(review)}
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
        isOpen={isCreateModalOpen || !!viewingReview}
        onClose={handleCloseModal}
      >
        <ModalHeader>
          {viewingReview ? 'View/Edit Review' : 'Create Review'}
        </ModalHeader>
        <ModalBody>
          <ReviewForm
            review={viewingReview}
            onSave={handleReviewSaved}
            onCancel={handleCloseModal}
          />
        </ModalBody>
      </Modal>
    </div>
  );
}