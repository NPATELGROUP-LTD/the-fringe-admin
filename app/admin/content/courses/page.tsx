'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable, Column, FilterConfig, ActiveFilter } from '@/components/ui/DataTable';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
import { BulkOperations } from '@/components/ui/BulkOperations';
import { ImportModal } from '@/components/ui/ImportModal';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import type { Course } from '@/types/database';
import { CourseForm } from './CourseForm';

interface CourseWithCategory extends Course {
  courses_categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface CourseDisplayData {
  id: string;
  title: string;
  slug: string;
  price: string;
  duration: string;
  courses_categories: string;
  is_active: string;
  created_at: string;
  // Keep original data for editing
  original?: CourseWithCategory;
}

interface CoursesResponse {
  data: CourseWithCategory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseDisplayData[]>([]);
  const [originalCourses, setOriginalCourses] = useState<CourseWithCategory[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseWithCategory | null>(null);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<CourseDisplayData[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const { data, loading, error, request } = useApiRequest<CoursesResponse>();

  // Load courses
  const loadCourses = async () => {
    await request('/api/courses');
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/courses-categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  useEffect(() => {
    loadCourses();
    loadCategories();
  }, []);

  useEffect(() => {
    if (data?.data) {
      setOriginalCourses(data.data);
      // Format data for display
      const formattedCourses: CourseDisplayData[] = data.data.map(course => ({
        id: course.id,
        title: course.title,
        slug: course.slug,
        price: `$${course.price}`,
        duration: `${course.duration} min`,
        courses_categories: course.courses_categories?.name || 'No Category',
        is_active: course.is_active ? 'Yes' : 'No',
        created_at: new Date(course.created_at).toLocaleDateString(),
        original: course,
      }));
      setCourses(formattedCourses);
    }
  }, [data]);

  const handleCreateCourse = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditCourse = (course: CourseDisplayData) => {
    setEditingCourse(course.original || null);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingCourse(null);
  };

  const handleCourseSaved = () => {
    handleCloseModal();
    loadCourses(); // Reload courses
  };

  const handleFiltersChange = (filters: ActiveFilter[]) => {
    setActiveFilters(filters);
  };

  const handleSelectionChange = (courses: CourseDisplayData[]) => {
    setSelectedCourses(courses);
  };

  const handleClearSelection = () => {
    setSelectedCourses([]);
  };

  const handleImportComplete = () => {
    loadCourses();
    setIsImportModalOpen(false);
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/courses/export');
      if (!response.ok) throw new Error('Failed to export courses');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `courses_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting courses:', error);
      alert('Error exporting courses');
    }
  };

  // Bulk operations
  const handleBulkStatusChange = async (courses: CourseDisplayData[], value?: string) => {
    const results = { total: courses.length, successful: 0, failed: 0, errors: [] as any[] };

    for (const course of courses) {
      try {
        const response = await fetch(`/api/courses/${course.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: value === 'true' })
        });

        if (response.ok) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({ id: course.id, error: 'Failed to update status' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ id: course.id, error: 'Network error' });
      }
    }

    if (results.successful > 0) {
      loadCourses();
    }

    return results;
  };

  const handleBulkCategoryChange = async (courses: CourseDisplayData[], value?: string) => {
    const results = { total: courses.length, successful: 0, failed: 0, errors: [] as any[] };

    for (const course of courses) {
      try {
        const response = await fetch(`/api/courses/${course.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category_id: value })
        });

        if (response.ok) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({ id: course.id, error: 'Failed to update category' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ id: course.id, error: 'Network error' });
      }
    }

    if (results.successful > 0) {
      loadCourses();
    }

    return results;
  };

  const handleBulkDelete = async (courses: CourseDisplayData[], value?: string) => {
    const results = { total: courses.length, successful: 0, failed: 0, errors: [] as any[] };

    for (const course of courses) {
      try {
        const response = await fetch(`/api/courses/${course.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          results.successful++;
        } else {
          results.failed++;
          results.errors.push({ id: course.id, error: 'Failed to delete course' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ id: course.id, error: 'Network error' });
      }
    }

    if (results.successful > 0) {
      loadCourses();
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
      confirmMessage: (count: number) => `Are you sure you want to delete ${count} course${count !== 1 ? 's' : ''}? This action cannot be undone.`,
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

  const columns: Column<CourseDisplayData>[] = [
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
      key: 'courses_categories',
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
  const renderCell = (course: CourseDisplayData, column: Column<CourseDisplayData>) => {
    if (column.key === 'courses_categories') {
      return course.courses_categories || 'No Category';
    }
    if (column.key === 'is_active') {
      return course.is_active;
    }
    if (column.key === 'price') {
      return course.price;
    }
    if (column.key === 'created_at') {
      return course.created_at;
    }
    return String(course[column.key]);
  };

  if (loading && courses.length === 0) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-primary">Loading courses...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="text-red-600">Error loading courses: {error}</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">Courses</h1>
          <p className="text-primary text-sm md:text-base">Manage your course offerings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            Import CSV
          </Button>
          <Button variant="outline" onClick={handleExport}>
            Export CSV
          </Button>
          <Button onClick={handleCreateCourse}>
            Add Course
          </Button>
        </div>
      </div>

      <BulkOperations
        selectedItems={selectedCourses}
        onClearSelection={handleClearSelection}
        availableActions={bulkActions}
      />

      <DataTable
        data={courses as any}
        columns={columns}
        filterable={true}
        filterPlaceholder="Search courses..."
        filters={filters}
        activeFilters={activeFilters}
        onFiltersChange={handleFiltersChange}
        selectable={true}
        selectedItems={selectedCourses}
        onSelectionChange={handleSelectionChange}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || !!editingCourse}
        onClose={handleCloseModal}
      >
        <ModalHeader>
          {editingCourse ? 'Edit Course' : 'Create Course'}
        </ModalHeader>
        <ModalBody>
          <CourseForm
            course={editingCourse}
            onSave={handleCourseSaved}
            onCancel={handleCloseModal}
          />
        </ModalBody>
      </Modal>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
        title="Courses"
        apiEndpoint="/api/courses/import"
        csvTemplate="title,slug,description,price,duration,category_id,is_active\nIntroduction to Web Development,intro-web-dev,Learn the basics of web development,99.99,120,category-uuid,true\nAdvanced JavaScript,advanced-js,Master advanced JavaScript concepts,149.99,180,category-uuid,true"
        requiredFields={['title', 'slug', 'price', 'duration']}
        optionalFields={['description', 'category_id', 'is_active']}
        fieldDescriptions={{
          title: 'Course title',
          slug: 'URL-friendly identifier',
          description: 'Course description',
          price: 'Course price in dollars',
          duration: 'Duration in minutes',
          category_id: 'Category UUID',
          is_active: 'true or false'
        }}
      />
    </div>
  );
}