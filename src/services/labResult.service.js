import LabResult from '../models/labResult.model.js';
import LabOrder from '../models/labOrder.model.js';
import { uploadFile, getPresignedDownloadUrl, deleteFile } from '../config/storage.js';
import { POPULATE_FIELDS, POPULATE_FULL, POPULATE_BASIC, buildLabResultFilter, canAccessLabResult, canModifyLabResult, appendValidationNotes, buildStatsAggregation } from '../helpers/labResult.helper.js';

export const createLabResult = async (resultData, userId) => {
  const labOrder = await LabOrder.findById(resultData.labOrder);
  if (!labOrder) throw { status: 404, message: 'Ordre de laboratoire non trouvé' };
  if (!['in_progress', 'completed'].includes(labOrder.status)) throw { status: 400, message: 'L\'ordre doit être en cours ou complété pour ajouter des résultats' };

  const existingResult = await LabResult.findOne({ labOrder: resultData.labOrder });
  if (existingResult) throw { status: 409, message: 'Un résultat existe déjà pour cet ordre. Utilisez la mise à jour.' };

  const labResult = await LabResult.create({
    ...resultData,
    patient: labOrder.patient,
    performedBy: resultData.performedBy || userId
  });

  if (labOrder.status !== 'completed') {
    labOrder.status = 'completed';
    await labOrder.save();
  }

  await labResult.populate(POPULATE_BASIC);
  return labResult;
};

export const getLabResults = async (query, userId, userRole) => {
  const filter = buildLabResultFilter(query, userId, userRole);
  const options = {
    page: parseInt(query.page || 1),
    limit: parseInt(query.limit || 10),
    sort: { [query.sortBy || 'createdAt']: query.sortOrder === 'asc' ? 1 : -1 },
    populate: POPULATE_FIELDS
  };

  return await LabResult.paginate(filter, options);
};

export const getLabResultById = async (id, userId, userRole) => {
  const labResult = await LabResult.findById(id).populate(POPULATE_FULL);
  if (!labResult) throw { status: 404, message: 'Résultat de laboratoire non trouvé' };
  if (!canAccessLabResult(labResult, userId, userRole)) throw { status: 403, message: 'Accès non autorisé à ce résultat' };
  return labResult;
};

export const updateLabResult = async (id, updateData) => {
  const labResult = await LabResult.findById(id);
  if (!labResult) throw { status: 404, message: 'Résultat de laboratoire non trouvé' };
  if (!canModifyLabResult(labResult)) throw { status: 400, message: 'Impossible de modifier un résultat finalisé. Créez une révision.' };

  Object.assign(labResult, updateData);
  await labResult.save();
  await labResult.populate(POPULATE_BASIC);
  return labResult;
};

export const validateLabResult = async (id, validationData, userId) => {
  const labResult = await LabResult.findById(id);
  if (!labResult) throw { status: 404, message: 'Résultat de laboratoire non trouvé' };
  if (labResult.status === 'final') throw { status: 400, message: 'Ce résultat a déjà été validé' };

  labResult.status = 'final';
  labResult.validatedBy = validationData.validatedBy || userId;
  labResult.validatedAt = validationData.validatedAt || new Date();
  if (validationData.validationNotes) labResult.laboratoryComments = appendValidationNotes(labResult.laboratoryComments, validationData.validationNotes);

  await labResult.save();

  const labOrder = await LabOrder.findById(labResult.labOrder);
  if (labOrder && labOrder.status === 'completed') {
    labOrder.status = 'validated';
    await labOrder.save();
  }

  await labResult.populate('validatedBy', 'firstName lastName email');
  return labResult;
};

export const addRevision = async (id, revisionData, userId) => {
  const labResult = await LabResult.findById(id);
  if (!labResult) throw { status: 404, message: 'Résultat de laboratoire non trouvé' };

  const revision = {
    revisedBy: userId,
    revisedAt: new Date(),
    reason: revisionData.reason,
    changes: revisionData.changes,
    previousTestResults: labResult.testResults
  };

  labResult.revisions.push(revision);
  if (revisionData.testResults) labResult.testResults = revisionData.testResults;
  labResult.status = 'amended';
  await labResult.save();
  await labResult.populate('revisions.revisedBy', 'firstName lastName email');
  return labResult;
};

export const uploadPdfReport = async (id, file, userId) => {
  const labResult = await LabResult.findById(id);
  if (!labResult) throw { status: 404, message: 'Résultat de laboratoire non trouvé' };

  const fileName = `lab-report-${labResult._id}-${Date.now()}.pdf`;
  const s3Key = await uploadFile(file.buffer, fileName, file.mimetype, 'lab-reports');

  if (labResult.reportDocument?.s3Key) {
    try {
      await deleteFile(labResult.reportDocument.s3Key);
    } catch (deleteError) {
      // Ignore deletion errors for old files
    }
  }

  labResult.reportDocument = {
    fileName,
    s3Key,
    uploadedAt: new Date(),
    uploadedBy: userId,
    fileSize: file.size
  };

  await labResult.save();

  const labOrder = await LabOrder.findById(labResult.labOrder);
  if (labOrder && labOrder.status === 'validated') {
    labOrder.status = 'reported';
    await labOrder.save();
  }

  return labResult.reportDocument;
};

export const getReportDownloadUrl = async (id, userId, userRole) => {
  const labResult = await LabResult.findById(id);
  if (!labResult) throw { status: 404, message: 'Résultat de laboratoire non trouvé' };
  if (!labResult.reportDocument?.s3Key) throw { status: 404, message: 'Aucun rapport PDF disponible' };
  if (!canAccessLabResult(labResult, userId, userRole)) throw { status: 403, message: 'Accès non autorisé à ce rapport' };

  const downloadUrl = await getPresignedDownloadUrl(labResult.reportDocument.s3Key, 3600);
  return { downloadUrl, fileName: labResult.reportDocument.fileName, expiresIn: 3600 };
};

export const getAbnormalResults = async (id) => {
  const labResult = await LabResult.findById(id);
  if (!labResult) throw { status: 404, message: 'Résultat de laboratoire non trouvé' };

  return {
    abnormalResults: labResult.getAbnormalResults(),
    criticalResults: labResult.getCriticalResults(),
    flagsSummary: labResult.getFlagsSummary(),
    hasCriticalResults: labResult.hasCriticalResults
  };
};

export const getLabResultStats = async () => {
  const aggregations = buildStatsAggregation();
  const [totalResults, resultsByStatus, criticalResults, resultsWithReports, avgTestsPerResult] = await Promise.all([
    LabResult.countDocuments(),
    LabResult.aggregate(aggregations.byStatus),
    LabResult.countDocuments({ hasCriticalResults: true }),
    LabResult.countDocuments({ 'reportDocument.s3Key': { $exists: true } }),
    LabResult.aggregate(aggregations.avgTests)
  ]);

  return {
    total: totalResults,
    byStatus: resultsByStatus,
    withCriticalResults: criticalResults,
    withPdfReports: resultsWithReports,
    averageTestsPerResult: avgTestsPerResult[0]?.avgTests || 0
  };
};
