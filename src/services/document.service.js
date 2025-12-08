import Document from '../models/document.model.js';
import Patient from '../models/patient.model.js';
import Consultation from '../models/consultation.model.js';
import LabOrder from '../models/labOrder.model.js';
import Prescription from '../models/prescription.model.js';
import User from '../models/user.model.js';
import { uploadFile, getPresignedDownloadUrl, deleteFile } from '../config/storage.js';
import { POPULATE_FIELDS, POPULATE_VERSIONS, calculateChecksum, generateFileName, buildDocumentFilter, buildStorageData, buildFileData } from '../helpers/document.helper.js';

export const uploadDocument = async (file, documentData, userId, userIp) => {
  const patient = await Patient.findById(documentData.patient);
  if (!patient) throw { status: 404, message: 'Patient non trouvé' };

  const validations = [];
  if (documentData.consultation) validations.push(Consultation.findById(documentData.consultation));
  if (documentData.labOrder) validations.push(LabOrder.findById(documentData.labOrder));
  if (documentData.prescription) validations.push(Prescription.findById(documentData.prescription));

  const results = await Promise.all(validations);
  if (documentData.consultation && !results[0]) throw { status: 404, message: 'Consultation non trouvée' };
  if (documentData.labOrder && !results[validations.length > 1 ? 1 : 0]) throw { status: 404, message: 'Ordre de laboratoire non trouvé' };
  if (documentData.prescription && !results[validations.length - 1]) throw { status: 404, message: 'Prescription non trouvée' };

  const checksum = calculateChecksum(file.buffer);
  const fileName = generateFileName(documentData.category, file.originalname);
  const s3Key = await uploadFile(file.buffer, fileName, file.mimetype, `documents/${documentData.patient}`);

  const document = await Document.create({
    ...documentData,
    uploadedBy: userId,
    storage: buildStorageData(s3Key),
    file: buildFileData(file, checksum, fileName)
  });

  await document.populate([
    { path: 'patient', select: 'firstName lastName dateOfBirth' },
    { path: 'uploadedBy', select: 'firstName lastName email' }
  ]);

  await document.logAccess(userId, 'upload', userIp);
  return document;
};

export const getDocuments = async (query, userId, userRole) => {
  const filter = buildDocumentFilter(query, userId, userRole);
  const options = {
    page: parseInt(query.page || 1),
    limit: parseInt(query.limit || 10),
    sort: { [query.sortBy || 'createdAt']: query.sortOrder === 'asc' ? 1 : -1 },
    populate: POPULATE_FIELDS
  };

  return await Document.paginate(filter, options);
};

export const getDocumentById = async (id, userId, userRole, userIp) => {
  const document = await Document.findById(id)
    .populate(POPULATE_FIELDS);

  if (!document) throw { status: 404, message: 'Document non trouvé' };
  
  // Admin can access all documents
  if (userRole === 'admin') {
    await document.logAccess(userId, 'view', userIp);
    return document;
  }
  
  // Uploader can access their own documents
  if (document.uploadedBy._id.toString() === userId.toString()) {
    await document.logAccess(userId, 'view', userIp);
    return document;
  }
  
  // Medical staff (doctor, nurse, lab_technician) can access documents
  if (['doctor', 'nurse', 'lab_technician', 'pharmacist'].includes(userRole)) {
    await document.logAccess(userId, 'view', userIp);
    return document;
  }
  
  // Patient can only access their own documents (patient.user matches userId)
  if (userRole === 'patient') {
    if (document.patient?.user?.toString() === userId.toString()) {
      await document.logAccess(userId, 'view', userIp);
      return document;
    }
    throw { status: 403, message: 'Accès non autorisé à ce document' };
  }

  throw { status: 403, message: 'Vous n\'avez pas les permissions pour accéder à ce document' };
};

export const updateDocument = async (id, updateData, userId, userRole, userIp) => {
  const document = await Document.findById(id);
  if (!document) throw { status: 404, message: 'Document non trouvé' };
  if (userRole !== 'admin' && document.uploadedBy.toString() !== userId) throw { status: 403, message: 'Vous n\'avez pas les permissions pour modifier ce document' };

  Object.assign(document, updateData);
  await document.save();
  await document.populate([
    { path: 'patient', select: 'firstName lastName' },
    { path: 'uploadedBy', select: 'firstName lastName email' }
  ]);

  await document.logAccess(userId, 'edit', userIp);
  return document;
};

export const deleteDocument = async (id, userId, userRole) => {
  const document = await Document.findById(id);
  if (!document) throw { status: 404, message: 'Document non trouvé' };
  if (userRole !== 'admin' && document.uploadedBy.toString() !== userId) throw { status: 403, message: 'Vous n\'avez pas les permissions pour supprimer ce document' };

  try {
    await deleteFile(document.storage.s3Key);
    for (const version of document.versions) {
      if (version.storage?.s3Key) await deleteFile(version.storage.s3Key);
    }
  } catch (deleteError) {
    // Ignore S3 deletion errors
  }

  await document.deleteOne();
  return document._id;
};

export const getDownloadUrl = async (id, versionIndex, userId, userRole, userIp) => {
  const document = await Document.findById(id);
  if (!document) throw { status: 404, message: 'Document non trouvé' };
  if (userRole === 'patient' && document.patient.toString() !== userId) throw { status: 403, message: 'Accès non autorisé à ce document' };
  if (!document.hasAccess(userId)) throw { status: 403, message: 'Vous n\'avez pas les permissions pour télécharger ce document' };

  let s3Key, fileName;
  if (versionIndex !== undefined) {
    const version = document.versions[parseInt(versionIndex)];
    if (!version) throw { status: 404, message: 'Version non trouvée' };
    s3Key = version.storage.s3Key;
    fileName = version.file.fileName;
  } else {
    s3Key = document.storage.s3Key;
    fileName = document.file.fileName;
  }

  const downloadUrl = await getPresignedDownloadUrl(s3Key, 3600);
  await document.logAccess(userId, 'download', userIp);

  return { downloadUrl, fileName, expiresIn: 3600 };
};

export const createNewVersion = async (id, file, versionNotes, userId, userRole) => {
  const document = await Document.findById(id);
  if (!document) throw { status: 404, message: 'Document non trouvé' };
  if (userRole !== 'admin' && document.uploadedBy.toString() !== userId) throw { status: 403, message: 'Vous n\'avez pas les permissions pour créer une version' };

  const checksum = calculateChecksum(file.buffer);
  const fileName = `${document.category}-v${document.versions.length + 2}-${Date.now()}-${file.originalname}`;
  const s3Key = await uploadFile(file.buffer, fileName, file.mimetype, `documents/${document.patient}`);

  await document.createNewVersion(
    userId,
    buildStorageData(s3Key),
    buildFileData(file, checksum, fileName),
    versionNotes
  );

  await document.populate(POPULATE_FIELDS);
  return document;
};

export const shareDocument = async (id, sharedWith, accessLevel, expiresAt, userId, userRole) => {
  const document = await Document.findById(id);
  if (!document) throw { status: 404, message: 'Document non trouvé' };

  const user = await User.findById(sharedWith);
  if (!user) throw { status: 404, message: 'Utilisateur non trouvé' };
  if (userRole !== 'admin' && document.uploadedBy.toString() !== userId) throw { status: 403, message: 'Vous n\'avez pas les permissions pour partager ce document' };

  const existingShare = document.sharedWith.find(share => share.user.toString() === sharedWith);
  if (existingShare) {
    existingShare.accessLevel = accessLevel || existingShare.accessLevel;
    existingShare.expiresAt = expiresAt || existingShare.expiresAt;
  } else {
    document.sharedWith.push({ user: sharedWith, accessLevel: accessLevel || 'view', sharedBy: userId, expiresAt });
  }

  await document.save();
  await document.populate('sharedWith.user', 'firstName lastName email');
  return document;
};

export const revokeShare = async (id, targetUserId, userId, userRole) => {
  const document = await Document.findById(id);
  if (!document) throw { status: 404, message: 'Document non trouvé' };
  if (userRole !== 'admin' && document.uploadedBy.toString() !== userId) throw { status: 403, message: 'Vous n\'avez pas les permissions pour révoquer ce partage' };

  document.sharedWith = document.sharedWith.filter(share => share.user.toString() !== targetUserId);
  await document.save();
  return document;
};

export const getAccessLog = async (id, userId, userRole) => {
  const document = await Document.findById(id).populate('accessLog.user', 'firstName lastName email role');
  if (!document) throw { status: 404, message: 'Document non trouvé' };
  if (userRole !== 'admin' && document.uploadedBy.toString() !== userId) throw { status: 403, message: 'Accès non autorisé à l\'historique' };

  return { documentId: document._id, title: document.title, accessLog: document.accessLog };
};

export const getDocumentStats = async () => {
  const [totalDocuments, documentsByCategory, documentsByMimeType, totalSize, confidentialDocs, recentUploads] = await Promise.all([
    Document.countDocuments(),
    Document.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Document.aggregate([{ $group: { _id: '$file.mimeType', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
    Document.aggregate([{ $group: { _id: null, totalBytes: { $sum: '$file.size' } } }]),
    Document.countDocuments({ isConfidential: true }),
    Document.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
  ]);

  return {
    total: totalDocuments,
    byCategory: documentsByCategory,
    byMimeType: documentsByMimeType,
    totalSizeBytes: totalSize[0]?.totalBytes || 0,
    totalSizeMB: Math.round((totalSize[0]?.totalBytes || 0) / (1024 * 1024) * 100) / 100,
    confidential: confidentialDocs,
    recentUploads
  };
};
