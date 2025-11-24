import Pharmacy from '../models/pharmacy.model.js';
import User from '../models/user.model.js';
import { POPULATE_FIELDS, POPULATE_BASIC, buildPharmacyFilter, calculateDistances, sortByDistance, buildStatsAggregation } from '../helpers/pharmacy.helper.js';

export const createPharmacy = async (pharmacyData) => {
  const existingPharmacy = await Pharmacy.findOne({ licenseNumber: pharmacyData.licenseNumber });
  if (existingPharmacy) throw { status: 409, message: 'Une pharmacie avec ce numéro de licence existe déjà' };

  if (pharmacyData.assignedUsers?.length > 0) {
    const users = await User.find({ _id: { $in: pharmacyData.assignedUsers }, role: 'pharmacist' });
    if (users.length !== pharmacyData.assignedUsers.length) throw { status: 400, message: 'Certains utilisateurs n\'existent pas ou n\'ont pas le rôle pharmacist' };
  }

  return await Pharmacy.create(pharmacyData);
};

export const getPharmacies = async (query) => {
  const filter = buildPharmacyFilter(query);
  const options = {
    page: parseInt(query.page || 1),
    limit: parseInt(query.limit || 10),
    sort: { [query.sortBy || 'name']: query.sortOrder === 'asc' ? 1 : -1 },
    populate: POPULATE_BASIC
  };

  const result = await Pharmacy.paginate(filter, options);

  if (query.latitude && query.longitude) {
    result.docs = calculateDistances(result.docs, query.latitude, query.longitude);
    if (query.sortBy === 'distance') result.docs = sortByDistance(result.docs, query.sortOrder);
  }

  return result;
};

export const getNearbyPharmacies = async (latitude, longitude, maxDistance = 10) => {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);
  const maxDistanceKm = parseFloat(maxDistance);

  const pharmacies = await Pharmacy.findNearby(lat, lon, maxDistanceKm);
  const pharmaciesWithDistance = calculateDistances(pharmacies, latitude, longitude);
  return sortByDistance(pharmaciesWithDistance, 'asc');
};

export const getPharmacyById = async (id) => {
  const pharmacy = await Pharmacy.findById(id).populate(POPULATE_FIELDS);
  if (!pharmacy) throw { status: 404, message: 'Pharmacie non trouvée' };
  return pharmacy;
};

export const updatePharmacy = async (id, updateData) => {
  if (updateData.licenseNumber) {
    const existingPharmacy = await Pharmacy.findOne({ licenseNumber: updateData.licenseNumber, _id: { $ne: id } });
    if (existingPharmacy) throw { status: 409, message: 'Une pharmacie avec ce numéro de licence existe déjà' };
  }

  if (updateData.assignedUsers?.length > 0) {
    const users = await User.find({ _id: { $in: updateData.assignedUsers }, role: 'pharmacist' });
    if (users.length !== updateData.assignedUsers.length) throw { status: 400, message: 'Certains utilisateurs n\'existent pas ou n\'ont pas le rôle pharmacist' };
  }

  const pharmacy = await Pharmacy.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).populate(POPULATE_BASIC);
  if (!pharmacy) throw { status: 404, message: 'Pharmacie non trouvée' };
  return pharmacy;
};

export const deletePharmacy = async (id) => {
  const pharmacy = await Pharmacy.findById(id);
  if (!pharmacy) throw { status: 404, message: 'Pharmacie non trouvée' };

  pharmacy.isActive = false;
  pharmacy.partnershipStatus = 'inactive';
  await pharmacy.save();
  return pharmacy._id;
};

export const assignUserToPharmacy = async (id, userId) => {
  const user = await User.findOne({ _id: userId, role: 'pharmacist' });
  if (!user) throw { status: 404, message: 'Utilisateur non trouvé ou n\'a pas le rôle pharmacist' };

  const pharmacy = await Pharmacy.findById(id);
  if (!pharmacy) throw { status: 404, message: 'Pharmacie non trouvée' };
  if (pharmacy.assignedUsers.includes(userId)) throw { status: 400, message: 'Utilisateur déjà assigné à cette pharmacie' };

  pharmacy.assignedUsers.push(userId);
  await pharmacy.save();
  await pharmacy.populate(POPULATE_BASIC);
  return pharmacy;
};

export const removeUserFromPharmacy = async (id, userId) => {
  const pharmacy = await Pharmacy.findById(id);
  if (!pharmacy) throw { status: 404, message: 'Pharmacie non trouvée' };

  const userIndex = pharmacy.assignedUsers.indexOf(userId);
  if (userIndex === -1) throw { status: 400, message: 'Utilisateur non assigné à cette pharmacie' };

  pharmacy.assignedUsers.splice(userIndex, 1);
  await pharmacy.save();
  await pharmacy.populate(POPULATE_BASIC);
  return pharmacy;
};

export const checkPharmacyStatus = async (id) => {
  const pharmacy = await Pharmacy.findById(id);
  if (!pharmacy) throw { status: 404, message: 'Pharmacie non trouvée' };

  return {
    pharmacyId: pharmacy._id,
    name: pharmacy.name,
    isOpen: pharmacy.isOpenNow(),
    isActive: pharmacy.isActive,
    partnershipStatus: pharmacy.partnershipStatus
  };
};

export const getPharmacyStats = async () => {
  const aggregations = buildStatsAggregation();
  const [totalPharmacies, activePharmacies, inactivePharmacies, pharmaciesByType, pharmaciesByPartnershipStatus, pharmaciesWithControlledSubstances, pharmaciesWithInsurance] = await Promise.all([
    Pharmacy.countDocuments(),
    Pharmacy.countDocuments({ isActive: true }),
    Pharmacy.countDocuments({ isActive: false }),
    Pharmacy.aggregate(aggregations.byType),
    Pharmacy.aggregate(aggregations.byPartnershipStatus),
    Pharmacy.countDocuments({ canDispenseControlledSubstances: true, isActive: true }),
    Pharmacy.countDocuments({ acceptsInsurance: true, isActive: true })
  ]);

  return {
    total: totalPharmacies,
    active: activePharmacies,
    inactive: inactivePharmacies,
    byType: pharmaciesByType,
    byPartnershipStatus: pharmaciesByPartnershipStatus,
    withControlledSubstances: pharmaciesWithControlledSubstances,
    withInsurance: pharmaciesWithInsurance
  };
};
