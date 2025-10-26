import Appointment from '../models/appointment.model.js';
import User from '../models/user.model.js';
import { logger } from '../config/logger.js';
import mongoose from 'mongoose';

export const createAppointment = async (req, res) => {
  try {
    const { doctorId, patientId, dateTime, duration = 30, reason, notes } = req.body;
    const { userId: createdById, role } = req.user;

    
    let finalPatientId = patientId;
    if (role.name === 'patient') {
      finalPatientId = createdById; 
    } else if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required for non-patient users'
      });
    }

  
    const doctor = await User.findById(doctorId).populate('role');
    if (!doctor || doctor.role.name !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID'
      });
    }

  
    const patient = await User.findById(finalPatientId).populate('role');
    if (!patient) {
      return res.status(400).json({
        success: false,
        message: 'Patient not found'
      });
    }

 
    const appointmentDate = new Date(dateTime);
    const appointmentEndTime = new Date(appointmentDate.getTime() + duration * 60000);

    
    const doctorConflict = await Appointment.findOne({
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
        
          dateTime: { $gte: appointmentDate, $lt: appointmentEndTime }
        }
      ]
    });

    if (doctorConflict) {
      return res.status(409).json({
        success: false,
        message: `Dr. ${doctor.firstName} ${doctor.lastName} is not available at this time. Please choose another slot.`,
      });
    }

   
    const patientConflict = await Appointment.findOne({
      patient: finalPatientId,
      status: { $in: ['scheduled'] },
      dateTime: appointmentDate
    });

    if (patientConflict) {
      return res.status(409).json({
        success: false,
        message: `Patient ${patientConflict.patient.firstName} ${patientConflict.patient.lastName} already has an appointment at this time`
      });
    }

 
    const appointment = new Appointment({
      patient: finalPatientId,
      doctor: doctorId,
      dateTime: appointmentDate,
      duration,
      reason,
      notes,
      createdBy: createdById
    });

    await appointment.save();

    
    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email' },
      { path: 'doctor', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    logger.info(`Appointment created: ${appointment._id} by user ${createdById}`);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment
    });

  } catch (error) {
    logger.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating appointment'
    });
  }
};


export const getAppointments = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { page = 1, limit = 10, status, doctorId, patientId, date } = req.query;

    let filter = {};

   
    switch (role.name) {
      case 'patient':
        filter.patient = userId;
        break;
      case 'doctor':
        filter.doctor = userId;
        break;
      case 'admin':
      case 'secretary':
      case 'nurse':
        break;
      default:
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
    }

    if (status) filter.status = status;
    if (doctorId && (role.name === 'admin' || role.name === 'secretary')) {
      filter.doctor = doctorId;
    }
    if (patientId && (role.name === 'admin' || role.name === 'secretary' || role.name === 'doctor')) {
      filter.patient = patientId;
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.dateTime = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'firstName lastName email')
      .populate('doctor', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName')
      .sort({ dateTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(filter);

    res.json({
      success: true,
      appointments,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    logger.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching appointments'
    });
  }
};


export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;
    const updates = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const canModify = 
      role.name === 'admin' ||
      role.name === 'secretary' ||
      (role.name === 'doctor' && appointment.doctor.toString() === userId.toString()) ||
      (role.name === 'patient' && appointment.patient.toString() === userId.toString());
   

    if (!canModify) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this appointment'
      });
    }
   
    if (role.name === 'patient') {
      const allowedUpdates = ['notes'];
      const requestedUpdates = Object.keys(updates);
      const isValidUpdate = requestedUpdates.every(update => allowedUpdates.includes(update));
      
      if (!isValidUpdate) {
        return res.status(400).json({
          success: false,
          message: 'Patients can only update notes'
        });
      }
    }

    if (updates.dateTime) {
      const newDateTime = new Date(updates.dateTime);
      const duration = updates.duration || appointment.duration;
      const endTime = new Date(newDateTime.getTime() + duration * 60000);

      const conflict = await Appointment.findOne({
        _id: { $ne: id },
        doctor: updates.doctorId || appointment.doctor,
        status: { $in: ['scheduled'] },
        $or: [
          {
            dateTime: { $lte: newDateTime },
            $expr: {
              $gte: [
                { $add: ['$dateTime', { $multiply: ['$duration', 60000] }] },
                newDateTime
              ]
            }
          },
          {
            dateTime: { $gte: newDateTime, $lt: endTime }
          }
        ]
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: 'Time slot conflict detected'
        });
      }
    }
    
    Object.assign(appointment, updates);
    await appointment.save();

    await appointment.populate([
      { path: 'patient', select: 'firstName lastName email' },
      { path: 'doctor', select: 'firstName lastName email' },
      { path: 'createdBy', select: 'firstName lastName' }
    ]);

    logger.info(`Appointment ${id} updated by user ${userId}`);

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment
    });

  } catch (error) {
    logger.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating appointment'
    });
  }
};

export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;
    const { reason } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
  
    const canCancel = 
      role.name === 'admin' ||
      role.name === 'secretary' ||
      (role.name === 'doctor' && appointment.doctor.toString() === userId.toString()) ||
      (role.name === 'patient' && appointment.patient.toString() === userId.toString());

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    appointment.status = 'cancelled';
    if (reason) {
      appointment.notes = appointment.notes ? 
        `${appointment.notes}\n\nCancellation reason: ${reason}` : 
        `Cancellation reason: ${reason}`;
    }

    await appointment.save();

    logger.info(`Appointment ${id} cancelled by user ${userId}`);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment
    });

  } catch (error) {
    logger.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling appointment'
    });
  }
};


export const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

   
    const doctor = await User.findById(doctorId).populate('role');
    if (!doctor || doctor.role.name !== 'doctor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid doctor ID'
      });
    }

    const queryDate = new Date(date);
    const startDate = new Date(queryDate.setHours(0, 0, 0, 0));
    const endDate = new Date(queryDate.setHours(23, 59, 59, 999));

    
    const appointments = await Appointment.find({
      doctor: doctorId,
      dateTime: { $gte: startDate, $lte: endDate },
      status: { $in: ['scheduled'] }
    }).select('dateTime duration').sort({ dateTime: 1 });
  
    const workingHours = {
      start: 9, 
      end: 17,  
      slotDuration: 30 
    };

    
    const availableSlots = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(workingHours.start, 0, 0, 0);

    while (currentDate.getHours() < workingHours.end) {
      const slotStart = new Date(currentDate);
      const slotEnd = new Date(currentDate.getTime() + workingHours.slotDuration * 60000);
      
      const hasConflict = appointments.some(apt => {
        const aptStart = new Date(apt.dateTime);
        const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000);
        
        return (slotStart < aptEnd && slotEnd > aptStart);
      });

      if (!hasConflict) {
        availableSlots.push({
          startTime: slotStart.toISOString(),
          endTime: slotEnd.toISOString(),
          duration: workingHours.slotDuration
        });
      }

      currentDate.setMinutes(currentDate.getMinutes() + workingHours.slotDuration);
    }

    res.json({
      success: true,
      doctor: {
        id: doctor._id,
        name: `${doctor.firstName} ${doctor.lastName}`
      },
      date: date,
      availableSlots,
      bookedAppointments: appointments.length
    });

  } catch (error) {
    logger.error('Get doctor availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching availability'
    });
  }
};


export const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;
    const { notes } = req.body;

    if (role.name !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Only doctors can mark appointments as completed'
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (appointment.doctor.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only complete your own appointments'
      });
    }

    if (appointment.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled appointments can be completed'
      });
    }

    appointment.status = 'completed';
    if (notes) {
      appointment.notes = appointment.notes ? 
        `${appointment.notes}\n\nCompletion notes: ${notes}` : 
        `Completion notes: ${notes}`;
    }

    await appointment.save();

    logger.info(`Appointment ${id} completed by doctor ${userId}`);

    res.json({
      success: true,
      message: 'Appointment marked as completed',
      appointment
    });

  } catch (error) {
    logger.error('Complete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error completing appointment'
    });
  }
}

// Get appointment statistics with aggregation
export const getAppointmentStats = async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { startDate, endDate, doctorId } = req.query;

    // Build match stage based on role
    let matchStage = {};
    
    switch (role.name) {
      case 'patient':
        matchStage.patient = new mongoose.Types.ObjectId(userId);
        break;
      case 'doctor':
        matchStage.doctor = new mongoose.Types.ObjectId(userId);
        break;
      case 'admin':
      case 'secretary':
        // Can view all - no additional filter
        if (doctorId) {
          matchStage.doctor = new mongoose.Types.ObjectId(doctorId);
        }
        break;
      default:
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Add date range filter
    if (startDate || endDate) {
      matchStage.dateTime = {};
      if (startDate) matchStage.dateTime.$gte = new Date(startDate);
      if (endDate) matchStage.dateTime.$lte = new Date(endDate);
    }

    const stats = await Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          scheduledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          noShowCount: {
            $sum: { $cond: [{ $eq: ['$status', 'no_show'] }, 1, 0] }
          },
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
          completionRate: {
            $round: [
              { $multiply: [{ $divide: ['$completedCount', '$totalAppointments'] }, 100] },
              2
            ]
          },
          cancellationRate: {
            $round: [
              { $multiply: [{ $divide: ['$cancelledCount', '$totalAppointments'] }, 100] },
              2
            ]
          }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalAppointments: 0,
        scheduledCount: 0,
        completedCount: 0,
        cancelledCount: 0,
        noShowCount: 0,
        avgDuration: 0,
        totalDuration: 0,
        completionRate: 0,
        cancellationRate: 0
      }
    });

  } catch (error) {
    logger.error('Get appointment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching appointment statistics'
    });
  }
};

// Get appointments by doctor with aggregation
export const getAppointmentsByDoctor = async (req, res) => {
  try {
    const { role } = req.user;
    const { startDate, endDate, status } = req.query;

    // Only admin and secretary can access this
    if (!['admin', 'secretary'].includes(role.name)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    let matchStage = {};
    
    // Add date filter
    if (startDate || endDate) {
      matchStage.dateTime = {};
      if (startDate) matchStage.dateTime.$gte = new Date(startDate);
      if (endDate) matchStage.dateTime.$lte = new Date(endDate);
    }

    // Add status filter
    if (status) {
      matchStage.status = status;
    }

    const doctorStats = await Appointment.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor',
          foreignField: '_id',
          as: 'doctorInfo'
        }
      },
      { $unwind: '$doctorInfo' },
      {
        $group: {
          _id: '$doctor',
          doctorName: { $first: { $concat: ['$doctorInfo.firstName', ' ', '$doctorInfo.lastName'] } },
          doctorEmail: { $first: '$doctorInfo.email' },
          totalAppointments: { $sum: 1 },
          scheduledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          avgDuration: { $avg: '$duration' },
          totalDuration: { $sum: '$duration' },
          appointments: {
            $push: {
              id: '$_id',
              dateTime: '$dateTime',
              duration: '$duration',
              status: '$status',
              reason: '$reason'
            }
          }
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
          completionRate: {
            $round: [
              { $multiply: [{ $divide: ['$completedCount', '$totalAppointments'] }, 100] },
              2
            ]
          },
          appointments: { $slice: ['$appointments', 5] } // Limit to 5 recent appointments
        }
      },
      { $sort: { totalAppointments: -1 } }
    ]);

    res.json({
      success: true,
      doctorStats
    });

  } catch (error) {
    logger.error('Get appointments by doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching doctor appointment statistics'
    });
  }
};

// Get daily appointment trends
export const getDailyAppointmentTrends = async (req, res) => {
  try {
    const { role } = req.user;
    const { days = 30 } = req.query;

    // Only admin and secretary can access this
    if (!['admin', 'secretary'].includes(role.name)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const trends = await Appointment.aggregate([
      {
        $match: {
          dateTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateTime' },
            month: { $month: '$dateTime' },
            day: { $dayOfMonth: '$dateTime' }
          },
          date: { $first: { $dateToString: { format: '%Y-%m-%d', date: '$dateTime' } } },
          totalAppointments: { $sum: 1 },
          scheduledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] }
          },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          avgDuration: { $avg: '$duration' }
        }
      },
      {
        $project: {
          _id: 0,
          date: 1,
          totalAppointments: 1,
          scheduledCount: 1,
          completedCount: 1,
          cancelledCount: 1,
          avgDuration: { $round: ['$avgDuration', 2] }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      trends,
      period: `${days} days`
    });

  } catch (error) {
    logger.error('Get daily appointment trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching appointment trends'
    });
  }
};

// Get busiest time slots
export const getBusiestTimeSlots = async (req, res) => {
  try {
    const { role } = req.user;

    // Only admin and secretary can access this
    if (!['admin', 'secretary'].includes(role.name)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const timeSlots = await Appointment.aggregate([
      {
        $match: {
          status: { $in: ['scheduled', 'completed'] }
        }
      },
      {
        $group: {
          _id: { $hour: '$dateTime' },
          appointmentCount: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          hour: '$_id',
          timeSlot: {
            $concat: [
              { $toString: '$_id' },
              ':00 - ',
              { $toString: { $add: ['$_id', 1] } },
              ':00'
            ]
          },
          appointmentCount: 1,
          avgDuration: { $round: ['$avgDuration', 2] },
          completedCount: 1,
          completionRate: {
            $round: [
              { $multiply: [{ $divide: ['$completedCount', '$appointmentCount'] }, 100] },
              2
            ]
          }
        }
      },
      { $sort: { appointmentCount: -1 } }
    ]);

    res.json({
      success: true,
      timeSlots
    });

  } catch (error) {
    logger.error('Get busiest time slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching time slot statistics'
    });
  }
};