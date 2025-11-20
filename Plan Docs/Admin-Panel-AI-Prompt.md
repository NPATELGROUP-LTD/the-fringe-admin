# AI Prompt: Multi-Service Business Admin Panel

## Context and Overview

You are tasked with building a comprehensive admin panel for a multi-service business platform. The system manages courses, services, customer interactions, and business content through an existing sophisticated database structure with 13 interconnected tables, plus additional admin management tables.

## Existing Database Schema (To Be Used)

### Content Management Tables
- **courses** - Course/course listings with pricing, duration, and details
- **courses_categories** - Categories for organizing courses
- **services** - Service offerings with duration and pricing  
- **service_categories** - Categories for organizing services
- **offers** - Promotional offers and discounts with validity periods

### User Engagement Tables
- **contact_submissions** - Contact form submissions from website visitors
- **newsletter_subscriptions** - Email newsletter subscribers with status management
- **reviews** - Customer reviews with 1-5 star ratings
- **testimonials** - Customer testimonials with ratings and approval status

### Content/Information Tables
- **faqs** - Frequently asked questions for customer support
- **business_info** - Company contact and business information
- **site_settings** - Site configuration key-value pairs for dynamic settings
- **statistics** - Site analytics and performance metrics

### Key Database Relationships (Existing)
- `courses.category_id` → `courses_categories.id`
- `services.category_id` → `service_categories.id`
- `reviews.category_id` → `courses_categories.id`
- All tables use UUID primary keys
- Unique constraints on slugs, email addresses, and configuration keys

### New Admin Tables to Add

**Admin Users Table:**
```sql
CREATE TABLE admin_users (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    email text UNIQUE NOT NULL,
    full_name text NOT NULL,
    role text DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'editor')),
    permissions jsonb DEFAULT '{}',
    avatar_url text,
    last_login timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
```

**Admin Sessions Table:**
```sql
CREATE TABLE admin_sessions (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    last_activity timestamp without time zone DEFAULT now()
);
```

**Admin Audit Log Table:**
```sql
CREATE TABLE admin_audit_log (
    id uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_user_id uuid NOT NULL REFERENCES admin_users(id),
    action text NOT NULL,
    table_name text,
    record_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp without time zone DEFAULT now()
);
```

## Core Requirements

### 1. Supabase Authentication System

**Supabase Authentication Integration:**
- Use Supabase Auth for secure email/password authentication for admin users
- Leverage Supabase's built-in user management system
- Integrate with admin_users table for role-based access control
- Use Supabase's JWT tokens for secure session management
- Implement row-level security (RLS) policies for admin access control

**Password Security:**
- All passwords must be hashed using Supabase's built-in hashing (bcrypt)
- Password transmission from frontend to backend must be encrypted (HTTPS only)
- Implement secure password validation and strength requirements
- Use Supabase's password reset functionality with secure token generation
- Never store or log raw passwords in any system logs

**Admin User Management:**
- Create and manage admin users through Supabase Auth
- Use admin_users table for additional admin metadata and permissions
- Implement role-based access control (admin, super_admin, editor)
- Store user avatars and additional profile information in admin_users table
- Track login sessions and activity through admin_sessions table

**Password Reset Feature:**
- Use Supabase Auth's built-in password reset functionality
- Generate secure reset tokens with expiration
- Send email notifications with secure reset links
- Implement password strength validation
- Track password change history to prevent reuse

**Security Middleware:**
- Protect all admin routes with Supabase Auth middleware
- Implement role-based access control for different admin functions
- Use Supabase's JWT token validation for session management
- Implement CSRF protection for all forms
- Add audit logging for admin actions and security events

### 2. Comprehensive CRUD Operations

**Content Management:**
- **Courses Management:**
  - Create, read, update, delete courses
  - Upload and manage course thumbnails/images
  - Category assignment and reassignment
  - Pricing and duration management
  - SEO-friendly slug generation
  - Rich text editing for course descriptions
  - JSON field editing for requirements and tags
  - Bulk operations (activate/deactivate, category reassignment)

- **Services Management:**
  - Full CRUD for services
  - Service categorization
  - Duration and pricing management
  - Image upload for service galleries
  - Availability scheduling integration
  - Service combination handling

- **Offers Management:**
  - Create and manage promotional offers
  - Percentage and fixed amount discounts
  - Validity period management
  - Usage limit tracking
  - Automatic offer activation/deactivation

- **Category Management:**
  - CRUD operations for both course and service categories
  - Category hierarchy management
  - Sort order management
  - Category slug optimization

**Content and Information:**
- **FAQ Management:**
  - Create, update, delete FAQ entries
  - Category-based organization
  - Search functionality
  - Bulk import/export capabilities

- **Business Information:**
  - Update contact information
  - Business hours management
  - Social media links
  - Location and address management

- **Site Settings:**
  - Key-value pair configuration
  - Setting categories and organization
  - Environment-specific settings
  - Configuration backup and restore

**User Engagement:**
- **Contact Submissions Management:**
  - View all contact form submissions
  - Mark as read/unread
  - Response tracking
  - Export functionality
  - Auto-notification settings

- **Newsletter Management:**
  - View all subscribers
  - Manage subscription status (subscribed/unsubscribed)
  - Bulk subscriber operations
  - Segmentation capabilities
  - Import/export subscriber lists

- **Reviews and Testimonials:**
  - Review approval workflow
  - Star rating management
  - Featured testimonial selection
  - Response to reviews
  - Rating analytics and reporting

### 3. Email Management and Export Features

**Email Export Functionality:**
- Export newsletter subscribers to CSV/Excel format
- Export contact submissions with filtering options
- Export reviews and testimonials
- Bulk email actions (unsubscribe, delete, etc.)
- Scheduled export reports
- Email list segmentation and filtering

**Email Campaign Management:**
- Create and send email newsletters
- Template management for email campaigns
- Subscriber segmentation based on interests
- Campaign performance tracking
- Automated email sequences

**Email Configuration:**
- SMTP settings management
- Email template customization
- Automated email triggers (new contact, password reset, etc.)
- Email delivery tracking and analytics

### 4. Dashboard and Analytics

**Overview Dashboard:**
- Total statistics from statistics table
- Recent activity feed (contact submissions, new subscribers)
- Revenue and booking trends
- Popular courses and services metrics
- Review and rating summaries

**Analytics and Reporting:**
- User engagement metrics
- Content performance analytics
- Revenue tracking and reporting
- Export analytics data
- Custom date range reporting

### 5. Advanced Features

**File Management:**
- Image upload and compression
- File organization and categorization
- Bulk file operations
- Image optimization for web
- CDN integration for file delivery

**Search and Filtering:**
- Global search across all content types
- Advanced filtering by categories, status, dates
- Tag-based filtering
- Full-text search implementation
- Search result highlighting

**Bulk Operations:**
- Bulk status changes (activate/deactivate)
- Bulk category assignments
- Bulk data import/export
- Batch operations with progress tracking

## Technical Implementation Requirements

### Frontend Stack
- **Framework:** Next.js 14+ with TypeScript
- **Styling:** Tailwind CSS (already configured)
- **State Management:** Context API or Zustand
- **Form Handling:** React Hook Form with validation
- **UI Components:** Custom components based on existing design system
- **Data Tables:** Advanced tables with sorting, filtering, pagination
- **Rich Text Editor:** For content editing (consider Quill.js or similar)

### Backend Implementation
- **API Routes:** Next.js API routes for all CRUD operations
- **Authentication:** Supabase Auth with JWT tokens
- **Database:** Supabase PostgreSQL with proper UUID handling and RLS
- **File Upload:** Supabase Storage for secure file upload with validation
- **Email Service:** Supabase Auth built-in email functionality + custom email service
- **Validation:** Comprehensive input validation and sanitization
- **Error Handling:** Proper error handling and logging with Supabase
- **Real-time:** Supabase real-time subscriptions for live updates

### Database Operations
- **UUID Handling:** Proper UUID generation and management
- **Soft Deletes:** Implement soft delete functionality where appropriate
- **Audit Trail:** Track changes for important operations
- **Performance:** Optimize queries with proper indexing
- **Transactions:** Ensure data consistency with database transactions

### Dynamic Image Management

**Image Upload System:**
- **Supabase Storage:** Use Supabase's "public" bucket for all image storage
- **Folder Organization:** Organize images by content type (`courses/`, `services/`, `offers/`, `general/`)
- **Dynamic Upload:** Images uploaded during card creation/editing in admin panel
- **File Validation:** Server-side validation for image types (JPEG, PNG, GIF, WebP)
- **Size Limits:** 5MB maximum file size with configurable limits
- **Unique Naming:** UUID-based filenames to prevent conflicts

**Image Upload Workflow:**
1. **Admin Panel Form:** User uploads image during course/service creation
2. **Frontend Validation:** Check file type and size before upload
3. **API Processing:** Send to `/api/upload` with folder specification
4. **Supabase Storage:** Store in organized folder structure with CDN delivery
5. **Database Update:** Save returned URL to `image_url` field in database
6. **Immediate Display:** Frontend automatically uses uploaded images via stored URLs

**Image Components:**
- **Reusable ImageUpload Component:** Drag & drop or click-to-upload interface
- **Real-time Preview:** Show uploaded image before saving
- **Progress Indicators:** Upload progress and status feedback
- **Error Handling:** Clear error messages for failed uploads
- **Folder Context:** Automatic folder assignment based on content type

**Storage Configuration:**
```sql
-- Supabase Storage Bucket Setup
-- Create "public" bucket in Supabase dashboard
-- Enable RLS policies:

CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'public');

CREATE POLICY "Admin Upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'public');

CREATE POLICY "Admin Delete" ON storage.objects
FOR DELETE USING (bucket_id = 'public');
```

**Frontend Image Handling Code:**
```typescript
// Reusable ImageUpload Component
"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./ImageUpload.module.css";

interface ImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  currentImage?: string;
  folder?: string; // 'courses', 'services', 'offers'
  maxSize?: number; // in MB
  isRequired?: boolean;
}

export default function ImageUpload({ 
  onImageUpload, 
  currentImage, 
  folder = "general",
  maxSize = 5,
  isRequired = false
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || "");
  const [error, setError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, GIF, WebP)");
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      setPreview(url);
      onImageUpload(url);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.uploadContainer}>
      <div className={styles.uploadArea}>
        {preview ? (
          <div className={styles.preview}>
            <Image src={preview} alt="Preview" className={styles.previewImage} fill />
            <div className={styles.previewOverlay}>
              <label className={styles.uploadButton}>
                Change Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className={styles.fileInput}
                />
              </label>
            </div>
          </div>
        ) : (
          <label className={styles.uploadLabel}>
            <div className={styles.uploadIcon}>📁</div>
            <div className={styles.uploadText}>
              <strong>Click to upload</strong>
              <span>or drag and drop</span>
            </div>
            <div className={styles.uploadInfo}>
              <small>PNG, JPG, GIF up to {maxSize}MB</small>
              {isRequired && <small className="text-red-500">* Required</small>}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className={styles.fileInput}
            />
          </label>
        )}
      </div>

      {uploading && (
        <div className={styles.uploading}>
          <div className={styles.spinner}></div>
          <span>Uploading...</span>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
}
```

**API Upload Route:**
```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = formData.get("folder") as string || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Server-side validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;

    // Supabase client setup
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("public")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("public")
      .getPublicUrl(filePath);

    return NextResponse.json({ 
      url: publicUrl,
      path: filePath,
      message: "File uploaded successfully"
    });

  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Admin Panel Form Integration:**
```typescript
// Example: Course Creation Form with Image Upload
"use client";

import { useState } from "react";
import ImageUpload from "@/components/shared/ImageUpload";
import { useRouter } from "next/navigation";

export default function CreateCourse() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    duration: 0,
    category_id: "",
    image_url: "",
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create course with image URL from formData
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push('/admin/courses');
      } else {
        throw new Error('Failed to create course');
      }
    } catch (error) {
      console.error('Error creating course:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">Course Image</label>
          <ImageUpload
            onImageUpload={(imageUrl) => {
              setFormData(prev => ({ ...prev, image_url: imageUrl }));
            }}
            currentImage={formData.image_url}
            folder="courses"
            maxSize={5}
            isRequired={true}
          />
        </div>

        {/* Other Form Fields */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2">
            Course Title
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium mb-2">
              Price ($)
            </label>
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium mb-2">
              Duration (hours)
            </label>
            <input
              type="number"
              id="duration"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              min="1"
              required
            />
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
            className="mr-2"
          />
          <label htmlFor="is_active" className="text-sm font-medium">
            Active (visible on website)
          </label>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.image_url}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create Course'}
          </button>
        </div>
      </div>
    </form>
  );
}
```

**Frontend Display (Automatic):**
```typescript
// Your existing frontend automatically displays uploaded images
{courses.map(course => (
  <div key={course.id} className="course-card">
    <img 
      src={course.image_url} // Uses Supabase URL from database
      alt={course.title}
      className="course-thumbnail w-full h-48 object-cover"
      onError={(e) => {
        // Fallback image if URL fails
        e.currentTarget.src = '/images/placeholder-course.jpg';
      }}
    />
    <div className="course-info">
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <div className="course-meta">
        <span className="price">${course.price}</span>
        <span className="duration">{course.duration} hours</span>
      </div>
    </div>
  </div>
))}
```

### Security Considerations

**Password Security:**
- All password transmission must use HTTPS encryption only
- Implement CSP (Content Security Policy) headers
- Use Supabase's built-in password hashing (bcrypt)
- Never log or store raw passwords
- Implement secure password policies (minimum 8 characters, complexity requirements)
- Use Supabase's JWT tokens for secure authentication

**Supabase Security:**
- Implement Row Level Security (RLS) policies for all tables
- Use Supabase Auth's built-in security features
- Validate all inputs through Supabase's validation system
- Use Supabase's built-in XSS protection
- Implement CSRF protection using Supabase's security headers
- Use Supabase Storage for secure file uploads with type validation

**Database Security:**
- Implement RLS policies for admin_users table (admin access only)
- Use RLS for all CRUD operations with proper role-based access
- Audit all admin actions through admin_audit_log table
- Rate limit API endpoints using Supabase's built-in rate limiting
- Use parameterized queries to prevent SQL injection

**Frontend Security:**
- Implement secure token handling with Supabase
- Use Supabase's session management
- Validate all forms on both frontend and backend
- Implement proper error handling without exposing sensitive data
- Use environment variables for all sensitive configuration
- Implement secure file upload with Supabase Storage policies

**Network Security:**
- All API calls must use HTTPS
- Implement proper CORS policies
- Use secure headers (HSTS, X-Frame-Options, etc.)
- Validate JWT tokens on every protected route
- Use Supabase's built-in DDoS protection

### API Request Management

**Problem Solved: Multiple API Calls Without Limits**
- **Issue:** Pages make 3-4 API calls if first one fails, without any request limits
- **Solution:** Implement `useApiRequest` hook for intelligent request management

**useApiRequest Hook Features:**
- **Request Deduplication:** Prevents duplicate simultaneous requests
- **Caching System:** Caches responses for specified duration (default 5 minutes)
- **Smart Retries:** Automatic retries with exponential backoff (max 3 retries)
- **Request Cancellation:** Cancels previous requests when component re-renders
- **Loading States:** Proper loading indicators and state management
- **Error Handling:** Graceful error handling with fallback data

**Implementation Example:**
```typescript
// Replace useEffect with useApiRequest for all data fetching
const { data: activeOffer } = useApiRequest(
  () => offerPopupService.getActiveOffer(),
  {
    cacheTime: 10 * 60 * 1000, // Cache for 10 minutes
    dedupe: true,
    retries: 3,
    retryDelay: 1000, // 1 second
    onSuccess: (data) => setData(data),
    onError: (error) => console.error(error),
  }
);

const { data: services, loading } = useApiRequest(
  () => servicesService.getAllServices({ limit: 12 }),
  {
    cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
    dedupe: true,
    retries: 3,
  }
);
```

**Benefits:**
- ✅ **Prevents Infinite Loops:** Stops repeated API calls on component re-renders
- ✅ **Smart Caching:** Reduces unnecessary API calls by caching responses
- ✅ **Better Performance:** Only fetches data when truly needed
- ✅ **Graceful Failures:** Proper error handling without breaking UI
- ✅ **Request Optimization:** Deduplication prevents multiple identical requests

**Page Implementation Strategy:**
1. **Identify All useEffect Data Fetching:** Find all components with API calls
2. **Replace with useApiRequest:** Convert to use the new hook
3. **Configure Cache Times:** Set appropriate cache duration based on data freshness needs
4. **Test Performance:** Monitor network requests to ensure optimization

**Cache Time Recommendations:**
- **Static Settings:** 30 minutes (site settings, business info)
- **Dynamic Content:** 5-10 minutes (offers, services, courses)
- **User-Specific Data:** 1 minute (admin data, user sessions)
- **Real-time Data:** 30 seconds (contact forms, reviews)

## UI/UX Requirements

### Design System

**Theme System:**
- **Light and Dark Mode:** Implement toggle between light and dark themes
- **Color Palette:** Use only solid black (#000000) and white (#FFFFFF) colors
- **No Gradients:** No gradient effects, transitions, or glowing effects anywhere
- **Solid Colors Only:** All elements must use solid black/white colors only
- **High Contrast:** Ensure sufficient contrast between text and backgrounds

**Visual Requirements:**
- **Clean Minimalism:** Simple, clean interface without decorative elements
- **Sharp Borders:** Use solid black borders and outlines
- **No Shadows:** No drop shadows, box shadows, or text shadows
- **No Animations:** Keep animations minimal and functional only
- **Typography:** Clean, readable fonts with proper hierarchy
- **Icons:** Simple, monochrome icons in solid black or white

**Responsive Design:**
- **Mobile-First:** Design for mobile devices first, then scale up
- **Tablet Support:** Proper layout for tablet devices (768px-1024px)
- **Desktop Support:** Full-featured desktop interface (1024px+)
- **Cross-Platform:** Works consistently across all devices and browsers
- **Touch-Friendly:** All buttons and interactive elements sized for touch interaction
- **Adaptive Layout:** Content reflows appropriately for different screen sizes

**Theme Implementation:**
```css
/* Light Theme */
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F5F5F5;
  --text-primary: #000000;
  --text-secondary: #333333;
  --border-color: #000000;
  --accent: #000000;
}

/* Dark Theme */
[data-theme="dark"] {
  --bg-primary: #000000;
  --bg-secondary: #1A1A1A;
  --text-primary: #FFFFFF;
  --text-secondary: #CCCCCC;
  --border-color: #FFFFFF;
  --accent: #FFFFFF;
}
```

**Component Styling:**
- **Buttons:** Solid black or white backgrounds with opposite color text
- **Forms:** Clean input fields with solid black borders
- **Tables:** Alternating solid background colors (pure black/white)
- **Navigation:** Simple black/white navigation bar
- **Cards:** Solid background with black borders
- **Modals:** Semi-transparent overlays with solid content areas

### User Experience
- **Intuitive Navigation:** Clear navigation structure
- **Bulk Operations:** Easy selection and bulk operations
- **Keyboard Shortcuts:** Power user keyboard shortcuts
- **Contextual Actions:** Right-click menus and contextual actions
- **Drag and Drop:** For file uploads and reordering
- **Real-time Updates:** Live updates where appropriate

### Dashboard Layout
- **Sidebar Navigation:** Collapsible sidebar with clear sections
- **Top Bar:** User info, notifications, logout
- **Main Content:** Grid layout for different admin sections
- **Widgets:** Modular dashboard widgets
- **Quick Actions:** Easy access to common operations

## Specific Implementation Tasks

### Phase 1: Authentication and Basic Setup
1. Set up admin authentication system
2. Create basic admin layout and navigation
3. Implement password reset functionality
4. Set up role-based access control

### Phase 2: Core CRUD Operations
1. Implement CRUD for all content tables
2. Create unified data table component
3. Implement bulk operations
4. Add search and filtering capabilities

### Phase 3: Email Management
1. Build email export functionality
2. Implement newsletter management
3. Create email template system
4. Add email campaign features

### Phase 4: Advanced Features
1. Implement file upload system
2. Create analytics dashboard
3. Add advanced reporting features
4. Implement audit logging

### Phase 5: Polish and Optimization
1. Add loading states and error handling
2. Implement keyboard shortcuts
3. Add help documentation
4. Performance optimization

## File Structure Recommendation

```
/src
  /app
    /admin
      /login
      /dashboard
      /courses
      /services
      /offers
      /categories
      /contacts
      /newsletter
      /reviews
      /faqs
      /settings
      /users
    /api
      /auth
      /courses
      /services
      /offers
      /categories
      /contacts
      /newsletter
      /reviews
      /faqs
      /settings
      /export
  /components
    /admin
      /layout
      /forms
      /tables
      /modals
    /ui
  /lib
    /auth
    /db
    /email
    /validation
```

## Success Criteria

The admin panel should successfully provide:
1. Secure authentication with email/password and password reset
2. Complete CRUD operations for all 13 database tables
3. Efficient email management with export capabilities
4. Intuitive user interface following existing design patterns
5. Comprehensive search, filtering, and bulk operation features
6. Proper security measures and error handling
7. Mobile-responsive design
8. Performance optimization for large datasets

## Supabase Integration Requirements

### Database Setup
- **Use Existing Tables:** Extend the existing 13-table database structure (do not recreate)
- **Add New Tables:** Create only the admin-related tables (admin_users, admin_sessions, admin_audit_log)
- **Supabase Configuration:** Configure Supabase project with proper environment variables
- **Row Level Security:** Implement RLS policies for all tables including existing ones
- **Real-time:** Enable real-time subscriptions for live data updates

### Authentication Flow
1. **Frontend:** Use Supabase Auth client for login/logout
2. **Backend:** Validate Supabase JWT tokens in API routes
3. **Database:** Link Supabase auth users with admin_users table
4. **Session:** Use Supabase's session management with custom admin metadata
5. **Password:** All password handling through Supabase Auth (built-in hashing)

### File Structure with Supabase
```
/src
  /app
    /admin
      /login
      /dashboard
      /courses
      /services
      /offers
      /categories
      /contacts
      /newsletter
      /reviews
      /faqs
      /settings
      /users
    /api
      /auth (Supabase integration)
      /courses
      /services
      /offers
      /categories
      /contacts
      /newsletter
      /reviews
      /faqs
      /settings
      /export
  /lib
    /supabase (Supabase client setup)
    /auth (Supabase Auth helpers)
    /db (Database queries with RLS)
  /components
    /admin
      /layout
      /forms
      /tables
      /modals
    /ui
```

### Supabase Security Configuration
```sql
-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create admin access policies
CREATE POLICY "Admin users can access all data" ON courses
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'authenticated' 
        AND EXISTS (
            SELECT 1 FROM admin_users 
            WHERE admin_users.email = auth.jwt() ->> 'email'
        )
    );
```

## Additional Notes

- Maintain consistency with the existing website's design language
- Implement proper loading states and error boundaries
- Use Supabase's real-time features for live notifications
- Plan for scalability using Supabase's built-in features
- Include comprehensive help documentation within the admin panel
- Use Supabase's backup and restore functionality for critical data
- Leverage Supabase's built-in email templates for admin communications
- Implement proper environment variable management for Supabase configuration

Build a professional, user-friendly admin panel that enables efficient management of all business operations while maintaining security through Supabase's enterprise-grade authentication and database features.