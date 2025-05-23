import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { supabaseAdmin } from '../lib/supabase';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow images, PDFs, and common document types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Save file metadata to database
export async function saveFileMetadata(
  userId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  filePath: string,
  invoiceId?: string,
  clientId?: string,
  reminderId?: string
) {
  const { data: attachment, error } = await supabaseAdmin
    .from('attachments')
    .insert({
      user_id: userId,
      file_name: fileName,
      file_type: fileType,
      file_size: fileSize,
      file_path: filePath,
      invoice_id: invoiceId,
      client_id: clientId,
      reminder_id: reminderId
    })
    .select()
    .single();

  if (error) throw error;
  return attachment;
}

// Get file metadata
export async function getFileMetadata(fileId: string) {
  const { data: file, error } = await supabaseAdmin
    .from('attachments')
    .select('*')
    .eq('id', fileId)
    .single();

  if (error) throw error;
  return file;
}

// Delete file
export async function deleteFile(fileId: string) {
  const file = await getFileMetadata(fileId);
  if (file) {
    // Delete from filesystem
    const filePath = path.join(process.cwd(), file.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database
    const { error } = await supabaseAdmin
      .from('attachments')
      .delete()
      .eq('id', fileId);

    if (error) throw error;
    return true;
  }
  return false;
} 