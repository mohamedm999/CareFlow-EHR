import Consultation from '../models/consultation.model.js';
import Appointment from '../models/appointment.model.js';
import Patient from '../models/patient.model.js';
import { POPULATE_FIELDS, canAccessConsultation } from '../helpers/consultation.helper.js';

export const createConsultation = async (consultationData, userId) => {
  const appointmentId = consultationData.appointment || consultationData.appointmentId;
  const patientId = consultationData.patient || consultationData.patientId;

  if (!patientId) throw { status: 400, message: 'Patient ID requis' };

  const patientExists = await Patient.exists({ _id: patientId });
  if (!patientExists) throw { status: 404, message: 'Patient non trouvé' };

  if (appointmentId) {
    const [appointmentExists, consultationExists] = await Promise.all([
      Appointment.exists({ _id: appointmentId }),
      Consultation.exists({ appointment: appointmentId })
    ]);
    if (!appointmentExists) throw { status: 404, message: 'Rendez-vous non trouvé' };
    if (consultationExists) throw { status: 400, message: 'Une consultation existe déjà pour ce rendez-vous' };
  }

  const consultation = await Consultation.create({
    ...consultationData,
    appointment: appointmentId,
    patient: patientId,
    doctor: consultationData.doctor || userId
  });

  await consultation.populate(POPULATE_FIELDS);
  return consultation;
};

export const getConsultations = async (query, user) => {
  const { role, _id } = user;
  const filter = {
    ...(query.patient && { patient: query.patient }),
    ...(query.doctor && { doctor: query.doctor }),
    ...(query.consultationType && { consultationType: query.consultationType }),
    ...(query.status && { status: query.status }),
    ...((query.startDate || query.endDate) && {
      consultationDate: {
        ...(query.startDate && { $gte: new Date(query.startDate) }),
        ...(query.endDate && { $lte: new Date(query.endDate) })
      }
    })
  };

  if (role.name === 'patient') {
    const patientRecord = await Patient.findOne({ user: _id }, '_id');
    if (patientRecord) filter.patient = patientRecord._id;
  } else if (['doctor', 'nurse'].includes(role.name)) {
    filter.doctor = _id;
  }

  return await Consultation.paginate(filter, {
    page: parseInt(query.page || 1),
    limit: parseInt(query.limit || 10),
    sort: { [query.sortBy || 'consultationDate']: query.sortOrder === 'asc' ? 1 : -1 },
    populate: POPULATE_FIELDS
  });
};

export const getConsultationById = async (id, user) => {
  const consultation = await Consultation.findById(id)
    .populate('patient', 'firstName lastName dateOfBirth gender bloodType allergies')
    .populate('doctor', 'firstName lastName email')
    .populate('appointment', 'appointmentDate reason status')
    .populate('reviewedBy', 'firstName lastName email');

  if (!consultation) throw { status: 404, message: 'Consultation non trouvée' };
  if (!await canAccessConsultation(consultation, user)) throw { status: 403, message: 'Accès non autorisé à cette consultation' };

  return consultation;
};

export const updateConsultation = async (id, updateData, userId, userRole) => {
  const consultation = await Consultation.findById(id);
  if (!consultation) throw { status: 404, message: 'Consultation non trouvée' };
  if (userRole !== 'admin' && consultation.doctor.toString() !== userId) throw { status: 403, message: 'Vous n\'êtes pas autorisé à modifier cette consultation' };

  Object.assign(consultation, updateData);
  await consultation.save();
  await consultation.populate(POPULATE_FIELDS);
  return consultation;
};

export const deleteConsultation = async (id, userId, userRole) => {
  const consultation = await Consultation.findById(id);
  if (!consultation) throw { status: 404, message: 'Consultation non trouvée' };
  if (userRole !== 'admin' && consultation.doctor.toString() !== userId) throw { status: 403, message: 'Vous n\'êtes pas autorisé à supprimer cette consultation' };

  await consultation.deleteOne();
  return id;
};

export const getConsultationsByPatient = async (patientId, query, user) => {
  if (!await Patient.exists({ _id: patientId })) throw { status: 404, message: 'Patient non trouvé' };

  if (user.role.name === 'patient') {
    const patientRecord = await Patient.findOne({ user: user._id }, '_id');
    if (!patientRecord || patientRecord._id.toString() !== patientId) throw { status: 403, message: 'Accès non autorisé' };
  }

  return await Consultation.paginate({ patient: patientId }, {
    page: parseInt(query.page || 1),
    limit: parseInt(query.limit || 10),
    sort: { consultationDate: -1 },
    populate: POPULATE_FIELDS
  });
};

export const updateVitalSigns = async (id, vitalSigns) => {
  const consultation = await Consultation.findByIdAndUpdate(id, { vitalSigns }, { new: true, runValidators: true });
  if (!consultation) throw { status: 404, message: 'Consultation non trouvée' };
  return consultation;
};

export const updateConsultationStatus = async (id, status, userId) => {
  const consultation = await Consultation.findByIdAndUpdate(
    id,
    { status, ...(status === 'reviewed' && { reviewedBy: userId, reviewedAt: new Date() }) },
    { new: true, runValidators: true }
  );
  if (!consultation) throw { status: 404, message: 'Consultation non trouvée' };
  return consultation;
};

export const getConsultationStats = async (query, user) => {
  const { role, _id } = user;
  const filter = {
    ...(query.doctorId ? { doctor: query.doctorId } : role.name === 'doctor' && { doctor: _id }),
    ...((query.startDate || query.endDate) && {
      consultationDate: {
        ...(query.startDate && { $gte: new Date(query.startDate) }),
        ...(query.endDate && { $lte: new Date(query.endDate) })
      }
    })
  };

  const stats = await Consultation.aggregate([
    { $match: filter },
    {
      $facet: {
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        byType: [{ $group: { _id: '$consultationType', count: { $sum: 1 } } }],
        total: [{ $count: 'total' }],
        averageDuration: [
          {
            $project: {
              duration: {
                $cond: {
                  if: '$completedAt',
                  then: { $subtract: ['$completedAt', '$consultationDate'] },
                  else: null
                }
              }
            }
          },
          { $match: { duration: { $ne: null } } },
          { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
        ]
      }
    }
  ]);

  return stats[0];
};
