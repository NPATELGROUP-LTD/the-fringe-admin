
'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useOnboarding } from '@/components/Onboarding';

// Lazy load Onboarding component
const Onboarding = dynamic(() => import('@/components/Onboarding').then(mod => ({ default: mod.Onboarding })), {
  loading: () => null,
  ssr: false
});

interface DashboardStats {
  statistics: {
    totalCourses: number;
    totalServices: number;
    totalContacts: number;
    totalNewsletter: number;
    totalReviews: number;
    totalTestimonials: number;
    totalOffers: number;
    totalCampaigns: number;
    sentCampaigns: number;
    totalEmailsSent: number;
  };
  recentActivity: Array<{
    type: string;
    title: string;
    subtitle: string;
    timestamp: string;
  }>;
  trends: {
    contacts: { current: number; previous: number; change: number };
    newsletter: { current: number; previous: number; change: number };
    revenue: { current: number; previous: number; change: number };
    bookings: { current: number; previous: number; change: number };
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { data, loading, error, request } = useApiRequest<DashboardStats>();

  const { hasCompleted, markCompleted } = useOnboarding('dashboard-tour');

  const tourSteps = [
    {
      target: '[data-tour="dashboard-title"]',
      title: 'Welcome to Your Dashboard!',
      content: 'This is your main dashboard where you can see an overview of your business metrics and recent activity.',
      position: 'bottom' as const
    },
    {
      target: '[data-tour="stats-cards"]',
      title: 'Key Statistics',
      content: 'These cards show important metrics like total courses, services, contacts, and newsletter subscribers.',
      position: 'top' as const
    },
    {
      target: '[data-tour="recent-activity"]',
      title: 'Recent Activity',
      content: 'Stay updated with the latest activity on your site, including new contacts and reviews.',
      position: 'left' as const
    },
    {
      target: '[data-tour="quick-actions"]',
      title: 'Quick Actions',
      content: 'Use these buttons for common tasks like adding courses, services, or sending emails.',
      position: 'right' as const
    },
    {
      target: '[data-tour="sidebar"]',
      title: 'Navigation Sidebar',
      content: 'Access all admin features through the sidebar. Click the toggle button to collapse/expand it.',
      position: 'right' as const
    }
  ];

  useEffect(() => {
    request('/api/dashboard/stats');
  }, [request]);

  useEffect(() => {
    if (data) {
      setStats(data);
    }
  }, [data]);

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '↗️';
    if (change < 0) return '↘️';
    return '→';
  };

  if (loading) {
    return (
      <div className="mobile-padding md:p-0">
        <h1 className="text-xl md:text-2xl font-bold text-primary mb-4 md:mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-secondary p-4 md:p-6 rounded border border-theme animate-pulse">
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-8 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="mobile-padding md:p-0">
        <h1 className="text-xl md:text-2xl font-bold text-primary mb-4 md:mb-6">Dashboard</h1>
        <ErrorMessage error={error || "Failed to load dashboard data"} variant="block" />
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-primary" data-tour="dashboard-title">Dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/analytics">
            <Button variant="outline" size="sm">
              📊 View Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" data-tour="stats-cards">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <span className="text-muted-foreground">📚</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.statistics.totalCourses}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className={getChangeColor(stats.trends.bookings.change)}>
                {getChangeIcon(stats.trends.bookings.change)} {formatChange(stats.trends.bookings.change)}
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <span className="text-muted-foreground">🔧</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.statistics.totalServices}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className={getChangeColor(stats.trends.contacts.change)}>
                {getChangeIcon(stats.trends.contacts.change)} {formatChange(stats.trends.contacts.change)}
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contact Submissions</CardTitle>
            <span className="text-muted-foreground">💬</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.statistics.totalContacts}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className={getChangeColor(stats.trends.contacts.change)}>
                {getChangeIcon(stats.trends.contacts.change)} {formatChange(stats.trends.contacts.change)}
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Newsletter Subscribers</CardTitle>
            <span className="text-muted-foreground">📧</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.statistics.totalNewsletter}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className={getChangeColor(stats.trends.newsletter.change)}>
                {getChangeIcon(stats.trends.newsletter.change)} {formatChange(stats.trends.newsletter.change)}
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Reviews</CardTitle>
            <span className="text-muted-foreground">⭐</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.statistics.totalReviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
            <span className="text-muted-foreground">🏷️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.statistics.totalOffers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Campaigns</CardTitle>
            <span className="text-muted-foreground">📤</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.statistics.sentCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {stats.statistics.totalEmailsSent} emails sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <span className="text-muted-foreground">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.trends.revenue.current}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <span className={getChangeColor(stats.trends.revenue.change)}>
                {getChangeIcon(stats.trends.revenue.change)} {formatChange(stats.trends.revenue.change)}
              </span>
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card data-tour="recent-activity">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'contact' ? 'bg-blue-500' :
                      activity.type === 'review' ? 'bg-green-500' :
                      'bg-purple-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.subtitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card data-tour="quick-actions">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <span className="text-lg">➕</span>
                <span className="text-xs">Add Course</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <span className="text-lg">🔧</span>
                <span className="text-xs">Add Service</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <span className="text-lg">📤</span>
                <span className="text-xs">Send Email</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <span className="text-lg">📄</span>
                <span className="text-xs">View Reports</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <span className="text-lg">👥</span>
                <span className="text-xs">Manage Users</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <span className="text-lg">🏷️</span>
                <span className="text-xs">Create Offer</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trends Section */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.trends.contacts.current}</div>
              <div className="text-sm text-muted-foreground">Contacts This Month</div>
              <div className={`text-xs flex items-center justify-center mt-1 ${getChangeColor(stats.trends.contacts.change)}`}>
                {getChangeIcon(stats.trends.contacts.change)}
                <span className="ml-1">{formatChange(stats.trends.contacts.change)}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.trends.newsletter.current}</div>
              <div className="text-sm text-muted-foreground">New Subscribers</div>
              <div className={`text-xs flex items-center justify-center mt-1 ${getChangeColor(stats.trends.newsletter.change)}`}>
                {getChangeIcon(stats.trends.newsletter.change)}
                <span className="ml-1">{formatChange(stats.trends.newsletter.change)}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.trends.bookings.current}</div>
              <div className="text-sm text-muted-foreground">Bookings This Month</div>
              <div className={`text-xs flex items-center justify-center mt-1 ${getChangeColor(stats.trends.bookings.change)}`}>
                {getChangeIcon(stats.trends.bookings.change)}
                <span className="ml-1">{formatChange(stats.trends.bookings.change)}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">${stats.trends.revenue.current}</div>
              <div className="text-sm text-muted-foreground">Revenue This Month</div>
              <div className={`text-xs flex items-center justify-center mt-1 ${getChangeColor(stats.trends.revenue.change)}`}>
                {getChangeIcon(stats.trends.revenue.change)}
                <span className="ml-1">{formatChange(stats.trends.revenue.change)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Onboarding
        steps={tourSteps}
        onComplete={markCompleted}
        autoStart={!hasCompleted}
      />
    </div>
  );
}
