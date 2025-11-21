'use client';

import { useState, useEffect } from 'react';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import StatisticsChart from '@/components/StatisticsChart';
import { StatisticsTracker } from '@/lib/statistics';
import type { Statistic } from '@/types/database';

interface AnalyticsData {
  userEngagement: {
    totalContacts: number;
    totalNewsletter: number;
    totalReviews: number;
    totalTestimonials: number;
    contactTrend: number;
    newsletterTrend: number;
    reviewTrend: number;
    testimonialTrend: number;
  };
  contentPerformance: {
    courses: {
      total: number;
      active: number;
      averageRating: number;
      totalViews: number;
    };
    services: {
      total: number;
      active: number;
      averageRating: number;
      totalViews: number;
    };
    offers: {
      total: number;
      active: number;
      totalUsage: number;
      conversionRate: number;
    };
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [statistics, setStatistics] = useState<Statistic[]>([]);
  const { data, loading, error, request } = useApiRequest<AnalyticsData>();
  const { data: statsData, request: statsRequest } = useApiRequest<Statistic[]>();

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  useEffect(() => {
    if (data) {
      setAnalyticsData(data);
    }
  }, [data]);

  useEffect(() => {
    if (statsData) {
      setStatistics(statsData);
    }
  }, [statsData]);

  const fetchAnalytics = () => {
    request('/api/analytics', {
      method: 'POST',
      body: JSON.stringify(dateRange)
    });
    statsRequest('/api/statistics?limit=20');
  };

  const refreshStatistics = async () => {
    try {
      await StatisticsTracker.initializeStatistics();
      statsRequest('/api/statistics?limit=20');
    } catch (error) {
      console.error('Failed to refresh statistics:', error);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dateRange,
          format
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatTrend = (trend: number) => {
    const sign = trend >= 0 ? '+' : '';
    return `${sign}${trend.toFixed(1)}%`;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return '↗️';
    if (trend < 0) return '↘️';
    return '→';
  };

  if (loading) {
    return (
      <div className="mobile-padding md:p-0">
        <h1 className="text-xl md:text-2xl font-bold text-primary mb-4 md:mb-6">Analytics & Reporting</h1>
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

  if (error || !analyticsData) {
    return (
      <div className="mobile-padding md:p-0">
        <h1 className="text-xl md:text-2xl font-bold text-primary mb-4 md:mb-6">Analytics & Reporting</h1>
        <div className="text-red-600">Failed to load analytics data</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold text-primary">Analytics & Reporting</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            📊 Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')}>
            📄 Export JSON
          </Button>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={fetchAnalytics} className="w-full">
                Apply Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Engagement Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-primary mb-4">User Engagement</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contact Submissions</CardTitle>
              <span className="text-muted-foreground">💬</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.userEngagement.totalContacts}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className={getTrendColor(analyticsData.userEngagement.contactTrend)}>
                  {getTrendIcon(analyticsData.userEngagement.contactTrend)} {formatTrend(analyticsData.userEngagement.contactTrend)}
                </span>
                <span className="ml-1">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Newsletter Subscribers</CardTitle>
              <span className="text-muted-foreground">📧</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.userEngagement.totalNewsletter}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className={getTrendColor(analyticsData.userEngagement.newsletterTrend)}>
                  {getTrendIcon(analyticsData.userEngagement.newsletterTrend)} {formatTrend(analyticsData.userEngagement.newsletterTrend)}
                </span>
                <span className="ml-1">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved Reviews</CardTitle>
              <span className="text-muted-foreground">⭐</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.userEngagement.totalReviews}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className={getTrendColor(analyticsData.userEngagement.reviewTrend)}>
                  {getTrendIcon(analyticsData.userEngagement.reviewTrend)} {formatTrend(analyticsData.userEngagement.reviewTrend)}
                </span>
                <span className="ml-1">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Testimonials</CardTitle>
              <span className="text-muted-foreground">💬</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.userEngagement.totalTestimonials}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <span className={getTrendColor(analyticsData.userEngagement.testimonialTrend)}>
                  {getTrendIcon(analyticsData.userEngagement.testimonialTrend)} {formatTrend(analyticsData.userEngagement.testimonialTrend)}
                </span>
                <span className="ml-1">vs previous period</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content Performance Analytics */}
      <div>
        <h2 className="text-lg font-semibold text-primary mb-4">Content Performance</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courses */}
          <Card>
            <CardHeader>
              <CardTitle>Courses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Courses</span>
                <span className="font-semibold">{analyticsData.contentPerformance.courses.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Courses</span>
                <span className="font-semibold">{analyticsData.contentPerformance.courses.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average Rating</span>
                <span className="font-semibold">{analyticsData.contentPerformance.courses.averageRating.toFixed(1)} ⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Views</span>
                <span className="font-semibold">{analyticsData.contentPerformance.courses.totalViews}</span>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Services</span>
                <span className="font-semibold">{analyticsData.contentPerformance.services.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Services</span>
                <span className="font-semibold">{analyticsData.contentPerformance.services.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average Rating</span>
                <span className="font-semibold">{analyticsData.contentPerformance.services.averageRating.toFixed(1)} ⭐</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Views</span>
                <span className="font-semibold">{analyticsData.contentPerformance.services.totalViews}</span>
              </div>
            </CardContent>
          </Card>

          {/* Offers */}
          <Card>
            <CardHeader>
              <CardTitle>Offers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Offers</span>
                <span className="font-semibold">{analyticsData.contentPerformance.offers.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Offers</span>
                <span className="font-semibold">{analyticsData.contentPerformance.offers.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Usage</span>
                <span className="font-semibold">{analyticsData.contentPerformance.offers.totalUsage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                <span className="font-semibold">{analyticsData.contentPerformance.offers.conversionRate.toFixed(1)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Statistics Visualization */}
      {statistics.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-primary">Statistics Overview</h2>
            <Button variant="outline" onClick={refreshStatistics}>
              🔄 Refresh Statistics
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Engagement Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>User Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <StatisticsChart
                  data={statistics
                    .filter(stat => stat.category === 'user_engagement')
                    .map(stat => ({
                      label: stat.label,
                      value: stat.value,
                      color: '#3b82f6'
                    }))}
                  type="bar"
                  height={250}
                />
              </CardContent>
            </Card>

            {/* Content Performance Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <StatisticsChart
                  data={statistics
                    .filter(stat => stat.category === 'content')
                    .map(stat => ({
                      label: stat.label,
                      value: stat.value,
                      color: '#10b981'
                    }))}
                  type="pie"
                  height={250}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}