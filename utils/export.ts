import { NewsletterSubscription, ContactSubmission } from '@/types/database';

// CSV Export Utility
export function arrayToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in values
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// Simple XLS Export (XML-based, compatible with Excel)
export function arrayToXLS(data: any[], sheetName: string = 'Sheet1'): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);

  let xml = '<?xml version="1.0"?>\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
  xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
  xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n';
  xml += ' <Worksheet ss:Name="' + sheetName + '">\n';
  xml += '  <Table>\n';

  // Add headers
  xml += '   <Row>\n';
  for (const header of headers) {
    xml += '    <Cell><Data ss:Type="String">' + header + '</Data></Cell>\n';
  }
  xml += '   </Row>\n';

  // Add data rows
  for (const row of data) {
    xml += '   <Row>\n';
    for (const header of headers) {
      const value = row[header] || '';
      const type = typeof value === 'number' ? 'Number' : 'String';
      xml += '    <Cell><Data ss:Type="' + type + '">' + value + '</Data></Cell>\n';
    }
    xml += '   </Row>\n';
  }

  xml += '  </Table>\n';
  xml += ' </Worksheet>\n';
  xml += '</Workbook>\n';

  return xml;
}

// Newsletter Export Functions
export function exportNewsletterToCSV(subscribers: NewsletterSubscription[], filters?: any): string {
  // Apply filters if provided
  let filteredData = subscribers;
  if (filters) {
    if (filters.status) {
      filteredData = filteredData.filter(sub => sub.status === filters.status);
    }
    if (filters.dateFrom) {
      filteredData = filteredData.filter(sub => new Date(sub.created_at) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filteredData = filteredData.filter(sub => new Date(sub.created_at) <= new Date(filters.dateTo));
    }
  }

  // Transform data for export
  const exportData = filteredData.map(sub => ({
    ID: sub.id,
    Email: sub.email,
    'First Name': sub.first_name || '',
    'Last Name': sub.last_name || '',
    Status: sub.status,
    'Subscribed At': sub.subscribed_at,
    'Unsubscribed At': sub.unsubscribed_at || '',
    Interests: sub.interests ? sub.interests.join('; ') : '',
    'Created At': sub.created_at,
    'Updated At': sub.updated_at,
  }));

  return arrayToCSV(exportData);
}

export function exportNewsletterToXLS(subscribers: NewsletterSubscription[], filters?: any): string {
  let filteredData = subscribers;
  if (filters) {
    if (filters.status) {
      filteredData = filteredData.filter(sub => sub.status === filters.status);
    }
    if (filters.dateFrom) {
      filteredData = filteredData.filter(sub => new Date(sub.created_at) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filteredData = filteredData.filter(sub => new Date(sub.created_at) <= new Date(filters.dateTo));
    }
  }

  const exportData = filteredData.map(sub => ({
    ID: sub.id,
    Email: sub.email,
    'First Name': sub.first_name || '',
    'Last Name': sub.last_name || '',
    Status: sub.status,
    'Subscribed At': sub.subscribed_at,
    'Unsubscribed At': sub.unsubscribed_at || '',
    Interests: sub.interests ? sub.interests.join('; ') : '',
    'Created At': sub.created_at,
    'Updated At': sub.updated_at,
  }));

  return arrayToXLS(exportData, 'Newsletter Subscribers');
}

// Contact Export Functions
export function exportContactsToCSV(contacts: ContactSubmission[], filters?: any): string {
  let filteredData = contacts;
  if (filters) {
    if (filters.isRead !== undefined) {
      filteredData = filteredData.filter(contact => contact.is_read === filters.isRead);
    }
    if (filters.dateFrom) {
      filteredData = filteredData.filter(contact => new Date(contact.created_at) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filteredData = filteredData.filter(contact => new Date(contact.created_at) <= new Date(filters.dateTo));
    }
  }

  const exportData = filteredData.map(contact => ({
    ID: contact.id,
    Name: contact.name,
    Email: contact.email,
    Phone: contact.phone || '',
    Subject: contact.subject,
    Message: contact.message,
    'Is Read': contact.is_read ? 'Yes' : 'No',
    'Responded At': contact.responded_at || '',
    Response: contact.response || '',
    'Created At': contact.created_at,
  }));

  return arrayToCSV(exportData);
}

export function exportContactsToXLS(contacts: ContactSubmission[], filters?: any): string {
  let filteredData = contacts;
  if (filters) {
    if (filters.isRead !== undefined) {
      filteredData = filteredData.filter(contact => contact.is_read === filters.isRead);
    }
    if (filters.dateFrom) {
      filteredData = filteredData.filter(contact => new Date(contact.created_at) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      filteredData = filteredData.filter(contact => new Date(contact.created_at) <= new Date(filters.dateTo));
    }
  }

  const exportData = filteredData.map(contact => ({
    ID: contact.id,
    Name: contact.name,
    Email: contact.email,
    Phone: contact.phone || '',
    Subject: contact.subject,
    Message: contact.message,
    'Is Read': contact.is_read ? 'Yes' : 'No',
    'Responded At': contact.responded_at || '',
    Response: contact.response || '',
    'Created At': contact.created_at,
  }));

  return arrayToXLS(exportData, 'Contact Submissions');
}

// Download helper function
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}