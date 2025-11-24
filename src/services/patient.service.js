import Patient from '../models/patient.model.js';
import User from '../models/user.model.js';
import { POPULATE_FIELDS, POPULATE_BASIC, buildPatientFilter, canAccessPatient, canUpdatePatient, validatePatientUpdates, buildStatsAggregation, buildBloodTypeAggregation, buildAllergyAnalyticsAggregation, buildConditionsTrendsAggregation, buildDemographicsAggregation, buildAtRiskAggregation } from '../helpers/patient.helper.js';

export const createPatient = async (patientData) => {
  const user = await User.findById(patientData.userId).populate('role');
  if (!user || user.role.name !== 'patient') throw { status: 400, message: 'Invalid patient user' };

  const existingPatient = await Patient.findOne({ user: patientData.userId });
  if (existingPatient) throw { status: 409, message: 'Patient profile already exists' };

  const patient = await Patient.create({ user: patientData.userId, ...patientData });
  await patient.populate(POPULATE_BASIC);
  return patient;
};

export const getPatients = async (query) => {
  const filter = await buildPatientFilter(query, User);
  const page = parseInt(query.page || 1);
  const limit = parseInt(query.limit || 10);

  const [patients, total] = await Promise.all([
    Patient.find(filter).populate(POPULATE_BASIC).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit),
    Patient.countDocuments(filter)
  ]);

  return { patients, total, pages: Math.ceil(total / limit) };
};

export const getPatientById = async (id, userId, userRole) => {
  const patient = await Patient.findById(id).populate(POPULATE_FIELDS);
  if (!patient) throw { status: 404, message: 'Patient not found' };
  if (!canAccessPatient(patient, userId, userRole)) throw { status: 403, message: 'Not authorized' };
  return patient;
};

export const updatePatient = async (id, updates, userId, userRole) => {
  const patient = await Patient.findById(id);
  if (!patient) throw { status: 404, message: 'Patient not found' };
  if (!canUpdatePatient(patient, userId, userRole)) throw { status: 403, message: 'Not authorized' };
  if (!validatePatientUpdates(updates, userRole)) throw { status: 400, message: 'Patients can only update emergency contact and consents' };

  Object.assign(patient, updates);
  await patient.save();
  await patient.populate(POPULATE_BASIC);
  return patient;
};

export const addAllergy = async (id, allergyData) => {
  const patient = await Patient.findById(id);
  if (!patient) throw { status: 404, message: 'Patient not found' };

  patient.allergies.push(allergyData);
  await patient.save();
  return patient;
};

export const addMedicalHistory = async (id, historyData) => {
  const patient = await Patient.findById(id);
  if (!patient) throw { status: 404, message: 'Patient not found' };

  patient.medicalHistory.push(historyData);
  await patient.save();
  return patient;
};

export const getPatientStats = async () => {
  const aggregations = buildStatsAggregation();
  const stats = await Patient.aggregate([{ $facet: aggregations }]);
  const result = stats[0];

  return {
    totalPatients: result.totalPatients[0]?.count || 0,
    byBloodType: result.byBloodType,
    patientsWithAllergies: result.withAllergies[0]?.count || 0,
    patientsWithActiveConditions: result.withActiveConditions[0]?.count || 0,
    commonAllergies: result.commonAllergies,
    commonConditions: result.commonConditions,
    patientsWithInsurance: result.withInsurance[0]?.count || 0,
    consents: {
      dataSharing: result.consentStats[0]?.dataSharing || 0,
      treatmentConsent: result.consentStats[0]?.treatmentConsent || 0
    }
  };
};

export const getPatientsByBloodType = async () => {
  return await Patient.aggregate(buildBloodTypeAggregation());
};

export const getAllergyAnalytics = async () => {
  return await Patient.aggregate(buildAllergyAnalyticsAggregation());
};

export const getMedicalConditionsTrends = async (status = 'active') => {
  return await Patient.aggregate(buildConditionsTrendsAggregation(status));
};

export const getPatientDemographics = async () => {
  const [ageGroups, genderDistribution] = await Promise.all([
    Patient.aggregate(buildDemographicsAggregation()),
    Patient.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      { $group: { _id: '$userInfo.gender', count: { $sum: 1 } } }
    ])
  ]);

  return { ageGroups, genderDistribution };
};

export const getPatientsAtRisk = async () => {
  const atRiskPatients = await Patient.aggregate(buildAtRiskAggregation());
  return { atRiskPatients, totalAtRisk: atRiskPatients.length };
};
