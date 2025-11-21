'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import StatisticsChart from '@/components/StatisticsChart';
import type { Statistic } from '@/types/database';

// Lazy load DataTable
const DataTable = dynamic(() => import('@/components/ui/DataTable').then(mod => ({ default: mod.DataTable })), {
  loading: () => <LoadingIndicator text="Loading table..." />
});

interface CreateStatisticForm {
  key: string;
  value: number;
  label: string;
  category: string;
  period: string;
}

const categories = [
  { value: 'user_engagement', label: 'User Engagement' },
  { value: 'content', label: 'Content Performance' },
  { value: 'performance', label: 'Performance Metrics' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'other', label: 'Other' }
];

export default function StatisticsPage() {
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStatistic, setEditingStatistic] = useState<Statistic | null>(null);
  const [formData, setFormData] = useState<CreateStatisticForm>({
    key: '',
    value: 0,
    label: '',
    category: 'other',
    period: 'current'
  });

  const { data, loading, request } = useApiRequest<Statistic[]>();
  const { request: createRequest, loading: createLoading } = useApiRequest();
  const { request: updateRequest, loading: updateLoading } = useApiRequest();
  const { request: deleteRequest, loading: deleteLoading } = useApiRequest();

  useEffect(() => {
    fetchStatistics();
  }, [selectedCategory]);

  useEffect(() => {
    if (data) {
      setStatistics(data);
    }
  }, [data]);

  const fetchStatistics = () => {
    const params = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
    request(`/api/statistics${params}`);
  };

  const handleCreate = async () => {
    try {
      await createRequest('/api/statistics', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setShowCreateModal(false);
      resetForm();
      fetchStatistics();
    } catch (error) {
      console.error('Failed to create statistic:', error);
    }
  };

  const handleUpdate = async (statistic: Statistic) => {
    try {
      await updateRequest(`/api/statistics/${statistic.key}`, {
        method: 'PUT',
        body: JSON.stringify({
          value: statistic.value,
          label: statistic.label,
          category: statistic.category,
          period: statistic.period
        })
      });
      setEditingStatistic(null);
      fetchStatistics();
    } catch (error) {
      console.error('Failed to update statistic:', error);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this statistic?')) return;

    try {
      await deleteRequest(`/api/statistics/${key}`, {
        method: 'DELETE'
      });
      fetchStatistics();
    } catch (error) {
      console.error('Failed to delete statistic:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      key: '',
      value: 0,
      label: '',
      category: 'other',
      period: 'current'
    });
  };

  const getChartData = () => {
    return statistics.map(stat => ({
      label: stat.label,
      value: stat.value,
      color: getCategoryColor(stat.category)
    }));
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      user_engagement: '#3b82f6',
      content: '#10b981',
      performance: '#f59e0b',
      revenue: '#ef4444',
      other: '#6b7280'
    };
    return colors[category] || colors.other;
  };

  const columns = [
    { key: 'key' as keyof Statistic, label: 'Key', sortable: true },
    { key: 'label' as keyof Statistic, label: 'Label', sortable: true },
    { key: 'value' as keyof Statistic, label: 'Value', sortable: true },
    { key: 'category' as keyof Statistic, label: 'Category', sortable: true },
    { key: 'period' as keyof Statistic, label: 'Period', sortable: true },
  ];

  return (
    <div className="mobile-padding md:p-0 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-primary">Statistics Management</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          Add Statistic
        </Button>
      </div>

      {/* Category Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </Select>
        </CardContent>
      </Card>

      {/* Statistics Chart */}
      {statistics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Statistics Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <StatisticsChart
              data={getChartData()}
              type="bar"
              title="Current Statistics"
              height={300}
            />
          </CardContent>
        </Card>
      )}

      {/* Statistics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics List</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">
              <LoadingIndicator text="Loading statistics..." />
            </div>
          ) : (
            <DataTable
              data={statistics}
              columns={columns}
              onEdit={(statistic) => setEditingStatistic(statistic as Statistic)}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Statistic Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
      >
        <ModalHeader onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}>Create New Statistic</ModalHeader>
        <ModalBody>
          <div>
            <Label htmlFor="key">Key</Label>
            <Input
              id="key"
              value={formData.key}
              onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
              placeholder="unique_key"
            />
          </div>
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Display Label"
            />
          </div>
          <div>
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              type="number"
              value={formData.value}
              onChange={(e) => setFormData(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="period">Period</Label>
            <Input
              id="period"
              value={formData.period}
              onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
              placeholder="current"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createLoading}
          >
            {createLoading ? 'Creating...' : 'Create'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Statistic Modal */}
      {editingStatistic && (
        <Modal
          isOpen={!!editingStatistic}
          onClose={() => setEditingStatistic(null)}
        >
          <ModalHeader onClose={() => setEditingStatistic(null)}>Edit Statistic</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
            <div>
              <Label>Key</Label>
              <Input value={editingStatistic.key} disabled />
            </div>
            <div>
              <Label htmlFor="edit-label">Label</Label>
              <Input
                id="edit-label"
                value={editingStatistic.label}
                onChange={(e) => setEditingStatistic(prev => prev ? { ...prev, label: e.target.value } : null)}
              />
            </div>
            <div>
              <Label htmlFor="edit-value">Value</Label>
              <Input
                id="edit-value"
                type="number"
                value={editingStatistic.value}
                onChange={(e) => setEditingStatistic(prev => prev ? { ...prev, value: parseFloat(e.target.value) || 0 } : null)}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select
                id="edit-category"
                value={editingStatistic.category}
                onChange={(e) => setEditingStatistic(prev => prev ? { ...prev, category: e.target.value } : null)}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setEditingStatistic(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => editingStatistic && handleUpdate(editingStatistic)}
              disabled={updateLoading}
            >
              {updateLoading ? 'Updating...' : 'Update'}
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}