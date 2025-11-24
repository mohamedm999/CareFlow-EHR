import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from './logger.js';
import crypto from 'crypto';
import mime from 'mime-types';

const validateS3Config = () => {
  const required = ['S3_ACCESS_KEY', 'S3_SECRET_KEY'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required S3 environment variables: ${missing.join(', ')}`);
  }
};

validateS3Config();

const s3Config = {
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY
  },
  forcePathStyle: true
};

const s3Client = new S3Client(s3Config);

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'careflow-documents';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const ALLOWED_EXTENSIONS = ['.pdf', '.jpeg', '.jpg', '.png', '.csv'];

const MAGIC_NUMBERS = {
  pdf: Buffer.from([0x25, 0x50, 0x44, 0x46]),
  jpeg: Buffer.from([0xFF, 0xD8, 0xFF]),
  png: Buffer.from([0x89, 0x50, 0x4E, 0x47])
};

export const validateMimeType = (mimeType) => {
  return ALLOWED_MIME_TYPES.includes(mimeType);
};

export const validateFileExtension = (filename) => {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return ALLOWED_EXTENSIONS.includes(ext);
};

export const validateFileMagicNumber = (buffer, filename) => {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.') + 1);
  
  if (ext === 'pdf') {
    return buffer.length >= 4 && MAGIC_NUMBERS.pdf.every((byte, i) => buffer[i] === byte);
  } else if (['jpeg', 'jpg'].includes(ext)) {
    return buffer.length >= 3 && MAGIC_NUMBERS.jpeg.every((byte, i) => buffer[i] === byte);
  } else if (ext === 'png') {
    return buffer.length >= 4 && MAGIC_NUMBERS.png.every((byte, i) => buffer[i] === byte);
  } else if (ext === 'csv') {
    return true;
  }
  return false;
};

export const validateFileSize = (size) => {
  return size <= MAX_FILE_SIZE;
};

export const generateUniqueFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(16).toString('hex');
  const extension = mime.extension(mime.lookup(originalName)) || 'bin';
  return `${timestamp}-${randomString}.${extension}`;
};

export const uploadFile = async (fileBuffer, fileName, mimeType, category = 'general') => {
  try {
    if (!validateMimeType(mimeType)) {
      throw new Error(`Type MIME non autorisé: ${mimeType}`);
    }

    if (!validateFileSize(fileBuffer.length)) {
      throw new Error(`Fichier trop volumineux. Taille maximale: ${MAX_FILE_SIZE / 1024 / 1024} Mo`);
    }

    const uniqueFileName = generateUniqueFileName(fileName);
    const key = `${category}/${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      Metadata: {
        originalName: fileName,
        uploadDate: new Date().toISOString()
      }
    });
 
    await s3Client.send(command);

    logger.info(`Fichier uploadé avec succès: ${key}`);
    
    return key; 
  } catch (error) {
    logger.error('Erreur lors de l\'upload du fichier:', error);
    throw error;
  }
};

export const getPresignedDownloadUrl = async (key, expiresIn = 600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    
    logger.info(`URL présignée générée pour: ${key}`);
    return url;
  } catch (error) {
    logger.error('Erreur lors de la génération de l\'URL présignée:', error);
    throw error;
  }
};

export const deleteFile = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
    logger.info(`Fichier supprimé: ${key}`);
  } catch (error) {
    logger.error('Erreur lors de la suppression du fichier:', error);
    throw error;
  }
};

export const getFileMetadata = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const response = await s3Client.send(command);
    
    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      metadata: response.Metadata
    };
  } catch (error) {
    logger.error('Erreur lors de la récupération des métadonnées:', error);
    throw error;
  }
};

export { s3Client, BUCKET_NAME, ALLOWED_MIME_TYPES, MAX_FILE_SIZE };
