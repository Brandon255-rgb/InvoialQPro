import React, { useState } from 'react';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Progress } from './ui/progress';

interface FileUploadProps {
  onUploadComplete?: (file: any) => void;
  accept?: string;
  maxSize?: number; // in bytes
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  accept = 'image/*,.pdf,.doc,.docx',
  maxSize = 5 * 1024 * 1024 // 5MB default
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: `File size must be less than ${maxSize / 1024 / 1024}MB`,
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const fileType = file.type;
    const acceptedTypes = accept.split(',');
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return fileType.startsWith(category);
      }
      return fileType === type;
    });

    if (!isValidType) {
      toast({
        title: "Error",
        description: "Invalid file type",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      setProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const uploadedFile = await response.json();
      setProgress(100);

      toast({
        title: "Success",
        description: "File uploaded successfully"
      });

      onUploadComplete?.(uploadedFile);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={accept}
          disabled={isUploading}
        />
      </div>
      {isUploading && (
        <Progress value={progress} className="w-full" />
      )}
    </div>
  );
}; 