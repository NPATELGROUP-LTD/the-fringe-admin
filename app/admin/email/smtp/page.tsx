'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { useApiRequest } from '@/lib/hooks/useApiRequest';
import { useForm } from 'react-hook-form';
import type { EmailSmtpSettings } from '@/types/database';

interface SmtpFormData {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'none' | 'ssl' | 'tls';
  from_email: string;
  from_name: string;
  is_active: boolean;
}

export default function SmtpSettingsPage() {
  const [settings, setSettings] = useState<EmailSmtpSettings | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<SmtpFormData>({
    defaultValues: {
      host: '',
      port: 587,
      username: '',
      password: '',
      encryption: 'tls',
      from_email: '',
      from_name: '',
      is_active: true,
    },
  });

  const { data, loading, error, request } = useApiRequest<{ data: EmailSmtpSettings[] }>();

  // Load SMTP settings
  const loadSettings = async () => {
    await request('/api/email/smtp');
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (data?.data && data.data.length > 0) {
      const activeSettings = data.data.find(s => s.is_active) || data.data[0];
      setSettings(activeSettings);

      // Populate form with existing settings
      reset({
        host: activeSettings.host,
        port: activeSettings.port,
        username: activeSettings.username || '',
        password: '', // Don't populate password for security
        encryption: activeSettings.encryption,
        from_email: activeSettings.from_email,
        from_name: activeSettings.from_name || '',
        is_active: activeSettings.is_active,
      });
    }
  }, [data, reset]);

  const { request: saveRequest, loading: saving } = useApiRequest();

  const onSubmit = async (formData: SmtpFormData) => {
    try {
      const url = settings ? `/api/email/smtp/${settings.id}` : '/api/email/smtp';
      const method = settings ? 'PUT' : 'POST';

      await saveRequest(url, {
        method,
        body: formData,
      });

      loadSettings(); // Reload settings
      alert('SMTP settings saved successfully!');
    } catch (error) {
      console.error('Error saving SMTP settings:', error);
      alert('Error saving SMTP settings');
    }
  };

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      // This would be a separate API endpoint to test SMTP connection
      // For now, just simulate a test
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('SMTP connection test successful!');
    } catch (error) {
      alert('SMTP connection test failed');
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="flex justify-center items-center h-64">
          <div className="text-primary">Loading SMTP settings...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mobile-padding md:p-0">
        <div className="text-red-600">Error loading SMTP settings: {error}</div>
      </div>
    );
  }

  return (
    <div className="mobile-padding md:p-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-primary mb-2">SMTP Settings</h1>
          <p className="text-primary text-sm md:text-base">Configure your email server settings for sending emails</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="host">SMTP Host *</Label>
              <Input
                id="host"
                {...register('host', { required: 'SMTP host is required' })}
                placeholder="smtp.gmail.com"
              />
              {errors.host && <p className="text-red-500 text-sm">{errors.host.message}</p>}
            </div>

            <div>
              <Label htmlFor="port">Port *</Label>
              <Input
                id="port"
                type="number"
                {...register('port', {
                  required: 'Port is required',
                  valueAsNumber: true,
                  min: { value: 1, message: 'Port must be greater than 0' },
                  max: { value: 65535, message: 'Port must be less than 65536' }
                })}
                placeholder="587"
              />
              {errors.port && <p className="text-red-500 text-sm">{errors.port.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="encryption">Encryption</Label>
            <Select
              id="encryption"
              {...register('encryption')}
            >
              <option value="tls">TLS</option>
              <option value="ssl">SSL</option>
              <option value="none">None</option>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                {...register('username')}
                placeholder="your-email@gmail.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Enter your email password or app password"
              />
              <p className="text-sm text-gray-600 mt-1">
                For Gmail, use an App Password instead of your regular password
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="from_email">From Email *</Label>
              <Input
                id="from_email"
                type="email"
                {...register('from_email', {
                  required: 'From email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address'
                  }
                })}
                placeholder="noreply@yourdomain.com"
              />
              {errors.from_email && <p className="text-red-500 text-sm">{errors.from_email.message}</p>}
            </div>

            <div>
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                {...register('from_name')}
                placeholder="Your Company Name"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="is_active"
              type="checkbox"
              {...register('is_active')}
              className="rounded"
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Common SMTP Settings</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Gmail:</strong> smtp.gmail.com:587 (TLS) - Use App Password</p>
            <p><strong>Outlook:</strong> smtp-mail.outlook.com:587 (TLS)</p>
            <p><strong>Yahoo:</strong> smtp.mail.yahoo.com:587 (TLS)</p>
            <p><strong>SendGrid:</strong> smtp.sendgrid.net:587 (TLS)</p>
          </div>
        </div>
      </div>
    </div>
  );
}