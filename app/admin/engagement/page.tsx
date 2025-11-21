import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function AdminEngagement() {
  return (
    <div className="mobile-padding md:p-0">
      <h1 className="text-xl md:text-2xl font-bold text-primary mb-4 md:mb-6">User Engagement</h1>
      <p className="text-primary text-sm md:text-base mb-6">Manage contact submissions, newsletter subscriptions, reviews, and testimonials.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/engagement/contacts">
          <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">Contact Submissions</span>
            <span className="text-sm text-gray-600">Manage customer inquiries</span>
          </Button>
        </Link>

        <Link href="/admin/engagement/newsletter">
          <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">Newsletter</span>
            <span className="text-sm text-gray-600">Manage subscriptions</span>
          </Button>
        </Link>

        <Link href="/admin/engagement/reviews">
          <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">Reviews</span>
            <span className="text-sm text-gray-600">Manage customer reviews</span>
          </Button>
        </Link>

        <Link href="/admin/engagement/testimonials">
          <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold">Testimonials</span>
            <span className="text-sm text-gray-600">Manage customer testimonials</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}