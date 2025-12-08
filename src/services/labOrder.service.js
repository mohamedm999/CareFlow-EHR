import LabOrder from '../models/labOrder.model.js';
import Patient from '../models/patient.model.js';
import Consultation from '../models/consultation.model.js';
import { POPULATE_FIELDS, POPULATE_BASIC, buildLabOrderFilter, canAccessLabOrder, canModifyLabOrder, canCancelLabOrder, isValidStatusTransition, appendNotes, buildStatsAggregation } from '../helpers/labOrder.helper.js';

export const createLabOrder = async (orderData, userId) => {
  const validations = [Patient.findById(orderData.patient)];
  if (orderData.consultation) validations.push(Consultation.findById(orderData.consultation));

  const [patient, consultation] = await Promise.all(validations);
  if (!patient) throw { status: 404, message: 'Patient non trouvé' };
  if (orderData.consultation && !consultation) throw { status: 404, message: 'Consultation non trouvée' };

  // Use new + save() to trigger pre-save hook for orderNumber generation
  const labOrder = new LabOrder({ ...orderData, doctor: orderData.doctor || userId });
  await labOrder.save();
  await labOrder.populate(POPULATE_BASIC);
  return labOrder;
};

export const getLabOrders = async (query, userId, userRole) => {
  const filter = buildLabOrderFilter(query, userId, userRole);
  const options = {
    page: parseInt(query.page || 1),
    limit: parseInt(query.limit || 10),
    sort: { [query.sortBy || 'createdAt']: query.sortOrder === 'asc' ? 1 : -1 },
    populate: POPULATE_FIELDS
  };

  const result = await LabOrder.paginate(filter, options);
  if (query.isOverdue === 'true') result.docs = result.docs.filter(order => order.isOverdue());
  return result;
};

export const getLabOrderById = async (id, userId, userRole, userPermissions = []) => {
  const labOrder = await LabOrder.findById(id).populate(POPULATE_FIELDS);
  if (!labOrder) throw { status: 404, message: 'Ordre de laboratoire non trouvé' };
  if (!canAccessLabOrder(labOrder, userId, userRole, userPermissions)) throw { status: 403, message: 'Accès non autorisé à cet ordre' };
  return labOrder;
};

export const updateLabOrder = async (id, updateData) => {
  const labOrder = await LabOrder.findById(id);
  if (!labOrder) throw { status: 404, message: 'Ordre de laboratoire non trouvé' };
  if (!canModifyLabOrder(labOrder)) throw { status: 400, message: `Impossible de modifier un ordre avec le statut ${labOrder.status}` };

  Object.assign(labOrder, updateData);
  await labOrder.save();
  await labOrder.populate(POPULATE_BASIC);
  return labOrder;
};

export const collectSpecimen = async (id, specimenData, userId) => {
  const labOrder = await LabOrder.findById(id);
  if (!labOrder) throw { status: 404, message: 'Ordre de laboratoire non trouvé' };
  if (labOrder.status !== 'ordered') throw { status: 400, message: 'Le spécimen a déjà été collecté' };

  labOrder.specimenCollection = {
    collectedAt: specimenData.collectedAt || new Date(),
    collectedBy: specimenData.collectedBy || userId,
    specimenCondition: specimenData.specimenCondition || 'good',
    collectionNotes: specimenData.collectionNotes,
    volume: specimenData.volume,
    containerType: specimenData.containerType
  };

  labOrder.status = 'collected';
  await labOrder.save();
  await labOrder.populate('specimenCollection.collectedBy', 'firstName lastName');
  return labOrder;
};

export const receiveSpecimen = async (id, receptionData, userId) => {
  const labOrder = await LabOrder.findById(id);
  if (!labOrder) throw { status: 404, message: 'Ordre de laboratoire non trouvé' };
  if (labOrder.status !== 'collected') throw { status: 400, message: 'Le spécimen doit d\'abord être collecté' };

  labOrder.specimenCollection.receivedAt = receptionData.receivedAt || new Date();
  labOrder.specimenCollection.receivedBy = receptionData.receivedBy || userId;
  if (receptionData.specimenCondition) labOrder.specimenCollection.specimenCondition = receptionData.specimenCondition;
  if (receptionData.receptionNotes) labOrder.specimenCollection.collectionNotes = appendNotes(labOrder.specimenCollection.collectionNotes, receptionData.receptionNotes);

  labOrder.status = 'received';
  await labOrder.save();
  return labOrder;
};

export const updateLabOrderStatus = async (id, status, statusNotes) => {
  const labOrder = await LabOrder.findById(id);
  if (!labOrder) throw { status: 404, message: 'Ordre de laboratoire non trouvé' };
  if (!isValidStatusTransition(labOrder.status, status)) throw { status: 400, message: `Transition de statut invalide: ${labOrder.status} -> ${status}` };

  labOrder.status = status;
  if (statusNotes) labOrder.clinicalNotes = appendNotes(labOrder.clinicalNotes, statusNotes);
  await labOrder.save();
  return labOrder;
};

export const cancelLabOrder = async (id, cancellationReason, userId) => {
  const labOrder = await LabOrder.findById(id);
  if (!labOrder) throw { status: 404, message: 'Ordre de laboratoire non trouvé' };
  if (!canCancelLabOrder(labOrder)) throw { status: 400, message: `Impossible d'annuler un ordre avec le statut ${labOrder.status}` };

  labOrder.status = 'cancelled';
  labOrder.cancellationReason = cancellationReason;
  labOrder.cancelledBy = userId;
  labOrder.cancelledAt = new Date();
  await labOrder.save();
  return labOrder;
};

export const getLabOrderStats = async () => {
  const aggregations = buildStatsAggregation();
  const [totalOrders, ordersByStatus, ordersByPriority, ordersByCategory, allOrders] = await Promise.all([
    LabOrder.countDocuments(),
    LabOrder.aggregate(aggregations.byStatus),
    LabOrder.aggregate(aggregations.byPriority),
    LabOrder.aggregate(aggregations.byCategory),
    LabOrder.find({ status: { $in: ['ordered', 'collected', 'received', 'in_progress'] } })
  ]);

  const overdueCount = allOrders.filter(order => order.isOverdue()).length;

  return {
    total: totalOrders,
    byStatus: ordersByStatus,
    byPriority: ordersByPriority,
    byCategory: ordersByCategory,
    overdue: overdueCount
  };
};
