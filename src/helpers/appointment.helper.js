import mongoose from 'mongoose';

export const POPULATE_FIELDS = [
  { path: 'patient', select: 'firstName lastName email' },
  { path: 'doctor', select: 'firstName lastName email' },
  { path: 'createdBy', select: 'firstName lastName' }
];

export const WORKING_HOURS = { start: 9, end: 17, slotDuration: 30 };

export const DEFAULT_STATS = {
  totalAppointments: 0,
  scheduledCount: 0,
  completedCount: 0,
  cancelledCount: 0,
  noShowCount: 0,
  avgDuration: 0,
  totalDuration: 0,
  completionRate: 0,
  cancellationRate: 0
};

export const buildDateFilter = (startDate, endDate) => {
  if (!startDate && !endDate) return {};
  return {
    dateTime: {
      ...(startDate && { $gte: new Date(startDate) }),
      ...(endDate && { $lte: new Date(endDate) })
    }
  };
};

export const buildRoleFilter = (role, userId, doctorId) => {
  const filter = {};
  switch (role.name) {
  case 'patient':
    filter.patient = new mongoose.Types.ObjectId(userId);
    break;
  case 'doctor':
    filter.doctor = new mongoose.Types.ObjectId(userId);
    break;
  case 'admin':
  case 'secretary':
    if (doctorId) filter.doctor = new mongoose.Types.ObjectId(doctorId);
    break;
  }
  return filter;
};

export const checkTimeConflict = (doctorId, appointmentDate, duration, excludeId = null) => ({
  _id: excludeId ? { $ne: excludeId } : undefined,
  doctor: doctorId,
  status: { $in: ['scheduled'] },
  $or: [
    {
      dateTime: { $lte: appointmentDate },
      $expr: {
        $gte: [
          { $add: ['$dateTime', { $multiply: ['$duration', 60000] }] },
          appointmentDate
        ]
      }
    },
    {
      dateTime: { $gte: appointmentDate, $lt: new Date(appointmentDate.getTime() + duration * 60000) }
    }
  ]
});

export const canModifyAppointment = (appointment, user) => {
  const { role, userId } = user;
  return (
    role.name === 'admin' ||
    role.name === 'secretary' ||
    (role.name === 'doctor' && appointment.doctor.toString() === userId.toString()) ||
    (role.name === 'patient' && appointment.patient.toString() === userId.toString())
  );
};

export const appendNotes = (existingNotes, newNotes, prefix) => {
  if (!newNotes) return existingNotes;
  const noteText = `${prefix}: ${newNotes}`;
  return existingNotes ? `${existingNotes}\n\n${noteText}` : noteText;
};

export const isAdminOrSecretary = (role) => ['admin', 'secretary'].includes(role.name);

export const generateAvailableSlots = (startDate, appointments) => {
  const availableSlots = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(WORKING_HOURS.start, 0, 0, 0);

  while (currentDate.getHours() < WORKING_HOURS.end) {
    const slotStart = new Date(currentDate);
    const slotEnd = new Date(currentDate.getTime() + WORKING_HOURS.slotDuration * 60000);

    const hasConflict = appointments.some(apt => {
      const aptStart = new Date(apt.dateTime);
      const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
      return (slotStart < aptEnd && slotEnd > aptStart);
    });

    if (!hasConflict) {
      availableSlots.push({
        startTime: slotStart.toISOString(),
        endTime: slotEnd.toISOString(),
        duration: WORKING_HOURS.slotDuration
      });
    }

    currentDate.setMinutes(currentDate.getMinutes() + WORKING_HOURS.slotDuration);
  }

  return availableSlots;
};

export const buildStatsPipeline = (matchStage) => [
  { $match: matchStage },
  {
    $group: {
      _id: null,
      totalAppointments: { $sum: 1 },
      scheduledCount: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
      completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
      noShowCount: { $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] } },
      avgDuration: { $avg: '$duration' },
      totalDuration: { $sum: '$duration' }
    }
  },
  {
    $project: {
      _id: 0,
      totalAppointments: 1,
      scheduledCount: 1,
      completedCount: 1,
      cancelledCount: 1,
      noShowCount: 1,
      avgDuration: { $round: ['$avgDuration', 2] },
      totalDuration: 1,
      completionRate: { $round: [{ $multiply: [{ $divide: ['$completedCount', '$totalAppointments'] }, 100] }, 2] },
      cancellationRate: { $round: [{ $multiply: [{ $divide: ['$cancelledCount', '$totalAppointments'] }, 100] }, 2] }
    }
  }
];

export const buildDoctorStatsPipeline = (matchStage) => [
  { $match: matchStage },
  { $lookup: { from: 'users', localField: 'doctor', foreignField: '_id', as: 'doctorInfo' } },
  { $unwind: '$doctorInfo' },
  {
    $group: {
      _id: '$doctor',
      doctorName: { $first: { $concat: ['$doctorInfo.firstName', ' ', '$doctorInfo.lastName'] } },
      doctorEmail: { $first: '$doctorInfo.email' },
      totalAppointments: { $sum: 1 },
      scheduledCount: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
      completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
      avgDuration: { $avg: '$duration' },
      totalDuration: { $sum: '$duration' },
      appointments: { $push: { id: '$_id', dateTime: '$dateTime', duration: '$duration', status: '$status', reason: '$reason' } }
    }
  },
  {
    $project: {
      _id: 0,
      doctorId: '$_id',
      doctorName: 1,
      doctorEmail: 1,
      totalAppointments: 1,
      scheduledCount: 1,
      completedCount: 1,
      cancelledCount: 1,
      avgDuration: { $round: ['$avgDuration', 2] },
      totalDuration: 1,
      completionRate: { $round: [{ $multiply: [{ $divide: ['$completedCount', '$totalAppointments'] }, 100] }, 2] },
      appointments: { $slice: ['$appointments', 5] }
    }
  },
  { $sort: { totalAppointments: -1 } }
];

export const buildTrendsPipeline = (startDate) => [
  { $match: { dateTime: { $gte: startDate } } },
  {
    $group: {
      _id: { year: { $year: '$dateTime' }, month: { $month: '$dateTime' }, day: { $dayOfMonth: '$dateTime' } },
      date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$dateTime' } } },
      totalAppointments: { $sum: 1 },
      scheduledCount: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
      completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
      avgDuration: { $avg: '$duration' }
    }
  },
  { $project: { _id: 0, date: 1, totalAppointments: 1, scheduledCount: 1, completedCount: 1, cancelledCount: 1, avgDuration: { $round: ['$avgDuration', 2] } } },
  { $sort: { date: 1 } }
];

export const buildTimeSlotsPipeline = () => [
  { $match: { status: { $in: ['scheduled', 'completed'] } } },
  {
    $group: {
      _id: { $hour: '$dateTime' },
      appointmentCount: { $sum: 1 },
      avgDuration: { $avg: '$duration' },
      completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
    }
  },
  {
    $project: {
      _id: 0,
      hour: '$_id',
      timeSlot: { $concat: [{ $toString: '$_id' }, ':00 - ', { $toString: { $add: ['$_id', 1] } }, ':00'] },
      appointmentCount: 1,
      avgDuration: { $round: ['$avgDuration', 2] },
      completedCount: 1,
      completionRate: { $round: [{ $multiply: [{ $divide: ['$completedCount', '$appointmentCount'] }, 100] }, 2] }
    }
  },
  { $sort: { appointmentCount: -1 } }
];
