'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal';
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

  const { data, loading, error, request } = useApiRequest<CoursesResponse>();

  // Load courses
  const loadCourses = async () => {
    await request('/api/courses');
  };

  useEffect(() => {
    loadCourses();
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

  const columns: Column<CourseWithCategory>[] = [
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
  const renderCell = (course: CourseWithCategory, column: Column<CourseWithCategory>) => {
    if (column.key === 'courses_categories') {
      return course.courses_categories?.name || 'No Category';
    }
    if (column.key === 'is_active') {
      return course.is_active ? 'Yes' : 'No';
    }
    if (column.key === 'price') {
      return `$${course.price}`;
    }
    if (column.key === 'created_at') {
      return new Date(course.created_at).toLocaleDateString();
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
        <Button onClick={handleCreateCourse}>
          Add Course
        </Button>
      </div>

      <DataTable
        data={courses as any}
        columns={columns}
        filterable={true}
        filterPlaceholder="Search courses..."
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
    </div>
  );
}