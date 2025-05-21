import React, { useState, useEffect } from 'react';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { FileUpload } from './FileUpload';

interface CompanySettings {
  id?: number;
  userId: number;
  logoPath?: string;
  companyName?: string;
  taxNumber?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export const CompanySettings: React.FC = () => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/company-settings', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: "Error",
        description: "Failed to load company settings",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    try {
      const response = await fetch('/api/company-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);

      toast({
        title: "Success",
        description: "Company settings updated successfully"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save company settings",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (file: any) => {
    if (settings) {
      setSettings({
        ...settings,
        logoPath: file.filePath
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="logo">Company Logo</Label>
          <FileUpload
            accept="image/*"
            onUploadComplete={handleLogoUpload}
          />
          {settings?.logoPath && (
            <img
              src={settings.logoPath}
              alt="Company logo"
              className="mt-2 h-20 w-auto"
            />
          )}
        </div>

        <div>
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={settings?.companyName || ''}
            onChange={(e) => setSettings(prev => ({ ...prev!, companyName: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="taxNumber">Tax Number</Label>
          <Input
            id="taxNumber"
            value={settings?.taxNumber || ''}
            onChange={(e) => setSettings(prev => ({ ...prev!, taxNumber: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={settings?.address || ''}
            onChange={(e) => setSettings(prev => ({ ...prev!, address: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={settings?.phone || ''}
            onChange={(e) => setSettings(prev => ({ ...prev!, phone: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={settings?.email || ''}
            onChange={(e) => setSettings(prev => ({ ...prev!, email: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={settings?.website || ''}
            onChange={(e) => setSettings(prev => ({ ...prev!, website: e.target.value }))}
          />
        </div>
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  );
}; 