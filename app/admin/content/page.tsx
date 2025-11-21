import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function AdminContent() {
  return (
    <div className="mobile-padding md:p-0">
      <h1 className="text-xl md:text-2xl font-bold text-primary mb-4 md:mb-6">Content Management</h1>
      <p className="text-primary text-sm md:text-base mb-6">Manage courses, services, offers, categories, FAQs, business info, and site settings.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/content/courses">
          <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">Courses</span>
            <span className="text-sm text-gray-600">Manage course offerings</span>
          </Button>
        </Link>

        <Link href="/admin/content/services">
          <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">Services</span>
            <span className="text-sm text-gray-600">Manage service offerings</span>
          </Button>
        </Link>

        <Link href="/admin/content/categories">
          <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">Categories</span>
            <span className="text-sm text-gray-600">Manage categories</span>
          </Button>
        </Link>

        <Link href="/admin/content/offers">
          <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">Offers</span>
            <span className="text-sm text-gray-600">Manage discount offers</span>
          </Button>
        </Link>

        <Link href="/admin/content/faqs">
          <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">FAQs</span>
            <span className="text-sm text-gray-600">Manage frequently asked questions</span>
          </Button>
        </Link>

        <Link href="/admin/content/business-info">
          <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">Business Info</span>
            <span className="text-sm text-gray-600">Manage contact details and info</span>
          </Button>
        </Link>

        <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center" disabled>
          <span className="text-lg font-semibold">Settings</span>
          <span className="text-sm text-gray-600">Coming soon</span>
        </Button>
      </div>
    </div>
  );
}