import multer from 'multer';
import { validateMimeType, validateFileSize, validateFileExtension, validateFileMagicNumber, MAX_FILE_SIZE } from '../config/storage.js';

// Configuration du stockage en mémoire (fichier stocké dans un buffer)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!validateMimeType(file.mimetype)) {
    return cb(
      new Error(`Invalid MIME type: ${file.mimetype}`),
      false
    );
  }
  
  if (!validateFileExtension(file.originalname)) {
    return cb(
      new Error('Invalid file extension. Allowed: PDF, JPEG, PNG, CSV'),
      false
    );
  }
  
  cb(null, true);
};

const limits = {
  fileSize: MAX_FILE_SIZE,
  files: 5
};

// Configuration de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE, // 20 Mo max
    files: 5 // Maximum 5 fichiers en une fois
  }
});

// Gestion des erreurs multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `Fichier trop volumineux. Taille maximale: ${MAX_FILE_SIZE / 1024 / 1024} Mo`
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Trop de fichiers. Maximum 5 fichiers autorisés'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Champ de fichier inattendu'
      });
    }
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Erreur lors de l\'upload du fichier'
    });
  }
  
  next();
};

// Middleware pour upload d'un seul fichier
export const uploadSingle = (fieldName) => upload.single(fieldName);

// Middleware pour upload de plusieurs fichiers
export const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

// Middleware pour upload de fichiers multiples avec différents champs
export const uploadFields = (fields) => upload.fields(fields);

export default upload;
