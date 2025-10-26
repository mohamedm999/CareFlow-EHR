import Patient from '../models/patient.model.js';
import User from '../models/user.model.js';
import { logger } from '../config/logger.js';

// Create patient profile
export const createPatient = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).populate('role');
    if (!user || user.role.name !== 'patient') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient user'
      });
    }
  
    const existingPatient = await Patient.findOne({ user: userId });
    if (existingPatient) {
      return res.status(409).json({
        success: false,
        message: 'Patient profile already exists'
      });
    }

    const patient = new Patient({
      user: userId,
      ...req.body
    });

    await patient.save();
    await patient.populate('user', 'firstName lastName email phone');

    logger.info(`Patient profile created: ${patient._id}`);

    res.status(201).json({
      success: true,
      message: 'Patient profile created successfully',
      patient
    });
  } catch (error) {
    logger.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating patient'
    });
  }
};

export const getPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, bloodType } = req.query;

    let filter = {};

    if (search) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      filter.user = { $in: users.map(u => u._id) };
    }

    if (bloodType) filter.bloodType = bloodType;

    const patients = await Patient.find(filter)
      .populate('user', 'firstName lastName email phone dateOfBirth gender')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Patient.countDocuments(filter);

    res.json({
      success: true,
      patients,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching patients'
    });
  }
};

export const getPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;

    const patient = await Patient.findById(id)
      .populate('user', 'firstName lastName email phone dateOfBirth gender address');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Authorization: patient can only view their own profile
    if (role.name === 'patient' && patient.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.json({
      success: true,
      patient
    });
  } catch (error) {
    logger.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching patient'
    });
  }
};

// Update patient profile
export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, role } = req.user;
    const updates = req.body;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Authorization check
    const canUpdate = 
      ['admin', 'secretary', 'doctor'].includes(role.name) ||
      (role.name === 'patient' && patient.user.toString() === userId.toString());

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Patients can only update certain fields
    if (role.name === 'patient') {
      const allowedUpdates = ['emergencyContact', 'consents'];
      const requestedUpdates = Object.keys(updates);
      const isValid = requestedUpdates.every(key => 
        allowedUpdates.some(allowed => key.startsWith(allowed))
      );

      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Patients can only update emergency contact and consents'
        });
      }
    }

    Object.assign(patient, updates);
    await patient.save();
    await patient.populate('user', 'firstName lastName email phone');

    logger.info(`Patient ${id} updated by user ${userId}`);

    res.json({
      success: true,
      message: 'Patient updated successfully',
      patient
    });
  } catch (error) {
    logger.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating patient'
    });
  }
};

// Add allergy
export const addAllergy = async (req, res) => {
  try {
    const { id } = req.params;
    const { allergen, severity, notes } = req.body;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    patient.allergies.push({ allergen, severity, notes });
    await patient.save();

    res.json({
      success: true,
      message: 'Allergy added successfully',
      patient
    });
  } catch (error) {
    logger.error('Add allergy error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding allergy'
    });
  }
};

// Add medical history entry
export const addMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { condition, diagnosedDate, status, notes } = req.body;

    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    patient.medicalHistory.push({ condition, diagnosedDate, status, notes });
    await patient.save();

    res.json({
      success: true,
      message: 'Medical history added successfully',
      patient
    });
  } catch (error) {
    logger.error('Add medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding medical history'
    });
  }
};

// 🔥 AGGREGATION ENDPOINTS

// Get patient statistics with aggregation
export const getPatientStats = async (req, res) => {
  try {
    const stats = await Patient.aggregate([
      {
        $facet: {
          // Total patients count
          totalPatients: [
            { $count: 'count' }
          ],
          
          // Patients by blood type
          byBloodType: [
            {
              $group: {
                _id: '$bloodType',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } }
          ],
          
          // Patients with allergies
          withAllergies: [
            {
              $match: {
                'allergies.0': { $exists: true }
              }
            },
            { $count: 'count' }
          ],
          
          // Patients with active medical conditions
          withActiveConditions: [
            {
              $match: {
                'medicalHistory.status': 'active'
              }
            },
            { $count: 'count' }
          ],
          
          // Most common allergies
          commonAllergies: [
            { $unwind: '$allergies' },
            {
              $group: {
                _id: '$allergies.allergen',
                count: { $sum: 1 },
                severeCases: {
                  $sum: {
                    $cond: [{ $eq: ['$allergies.severity', 'severe'] }, 1, 0]
                  }
                }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          
          // Most common medical conditions
          commonConditions: [
            { $unwind: '$medicalHistory' },
            {
              $match: {
                'medicalHistory.status': 'active'
              }
            },
            {
              $group: {
                _id: '$medicalHistory.condition',
                count: { $sum: 1 }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          
          // Patients with insurance
          withInsurance: [
            {
              $match: {
                'insurance.provider': { $exists: true, $ne: null }
              }
            },
            { $count: 'count' }
          ],
          
          // Consent statistics
          consentStats: [
            {
              $group: {
                _id: null,
                dataSharing: {
                  $sum: {
                    $cond: ['$consents.dataSharing', 1, 0]
                  }
                },
                treatmentConsent: {
                  $sum: {
                    $cond: ['$consents.treatmentConsent', 1, 0]
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    const result = stats[0];

    res.json({
      success: true,
      stats: {
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
      }
    });

  } catch (error) {
    logger.error('Get patient stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching patient statistics'
    });
  }
};

// Get patients grouped by blood type with detailed info
export const getPatientsByBloodType = async (req, res) => {
  try {
    const patientsByBloodType = await Patient.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $group: {
          _id: '$bloodType',
          count: { $sum: 1 },
          patients: {
            $push: {
              id: '$_id',
              name: {
                $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName']
              },
              email: '$userInfo.email',
              phone: '$userInfo.phone',
              hasAllergies: {
                $cond: [{ $gt: [{ $size: { $ifNull: ['$allergies', []] } }, 0] }, true, false]
              },
              hasActiveConditions: {
                $cond: [
                  {
                    $gt: [
                      {
                        $size: {
                          $filter: {
                            input: { $ifNull: ['$medicalHistory', []] },
                            cond: { $eq: ['$$this.status', 'active'] }
                          }
                        }
                      },
                      0
                    ]
                  },
                  true,
                  false
                ]
              }
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      bloodTypeGroups: patientsByBloodType
    });

  } catch (error) {
    logger.error('Get patients by blood type error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching patients by blood type'
    });
  }
};

// Get allergy analytics
export const getAllergyAnalytics = async (req, res) => {
  try {
    const allergyAnalytics = await Patient.aggregate([
      { $unwind: '$allergies' },
      {
        $group: {
          _id: {
            allergen: '$allergies.allergen',
            severity: '$allergies.severity'
          },
          count: { $sum: 1 },
          patients: {
            $push: {
              patientId: '$_id',
              notes: '$allergies.notes'
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.allergen',
          totalCases: { $sum: '$count' },
          severityBreakdown: {
            $push: {
              severity: '$_id.severity',
              count: '$count'
            }
          },
          mildCases: {
            $sum: {
              $cond: [{ $eq: ['$_id.severity', 'mild'] }, '$count', 0]
            }
          },
          moderateCases: {
            $sum: {
              $cond: [{ $eq: ['$_id.severity', 'moderate'] }, '$count', 0]
            }
          },
          severeCases: {
            $sum: {
              $cond: [{ $eq: ['$_id.severity', 'severe'] }, '$count', 0]
            }
          }
        }
      },
      { $sort: { totalCases: -1 } }
    ]);

    res.json({
      success: true,
      allergyAnalytics
    });

  } catch (error) {
    logger.error('Get allergy analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching allergy analytics'
    });
  }
};

// Get medical conditions trends
export const getMedicalConditionsTrends = async (req, res) => {
  try {
    const { status = 'active' } = req.query;

    const conditionsTrends = await Patient.aggregate([
      { $unwind: '$medicalHistory' },
      {
        $match: {
          'medicalHistory.status': status
        }
      },
      {
        $group: {
          _id: '$medicalHistory.condition',
          count: { $sum: 1 },
          averageDuration: {
            $avg: {
              $divide: [
                { $subtract: [new Date(), '$medicalHistory.diagnosedDate'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            }
          },
          patients: {
            $push: {
              patientId: '$_id',
              diagnosedDate: '$medicalHistory.diagnosedDate',
              notes: '$medicalHistory.notes'
            }
          }
        }
      },
      {
        $project: {
          condition: '$_id',
          count: 1,
          averageDurationDays: { $round: ['$averageDuration', 0] },
          patientCount: { $size: '$patients' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      status,
      trends: conditionsTrends
    });

  } catch (error) {
    logger.error('Get medical conditions trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching medical conditions trends'
    });
  }
};

// Get patient age demographics (requires dateOfBirth in User model)
export const getPatientDemographics = async (req, res) => {
  try {
    const demographics = await Patient.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          bloodType: 1,
          gender: '$userInfo.gender',
          age: {
            $divide: [
              { $subtract: [new Date(), '$userInfo.dateOfBirth'] },
              1000 * 60 * 60 * 24 * 365 // Convert to years
            ]
          },
          hasInsurance: {
            $cond: [
              { $and: [{ $ne: ['$insurance.provider', null] }, { $ne: ['$insurance.provider', ''] }] },
              true,
              false
            ]
          }
        }
      },
      {
        $bucket: {
          groupBy: '$age',
          boundaries: [0, 18, 30, 45, 60, 75, 200],
          default: 'Unknown',
          output: {
            count: { $sum: 1 },
            withInsurance: {
              $sum: { $cond: ['$hasInsurance', 1, 0] }
            },
            bloodTypes: {
              $push: '$bloodType'
            }
          }
        }
      }
    ]);

    // Gender distribution
    const genderStats = await Patient.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $group: {
          _id: '$userInfo.gender',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      demographics: {
        ageGroups: demographics,
        genderDistribution: genderStats
      }
    });

  } catch (error) {
    logger.error('Get patient demographics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching patient demographics'
    });
  }
};

// Get patients at risk (multiple severe allergies or chronic conditions)
export const getPatientsAtRisk = async (req, res) => {
  try {
    const atRiskPatients = await Patient.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          name: {
            $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName']
          },
          email: '$userInfo.email',
          phone: '$userInfo.phone',
          bloodType: 1,
          severeAllergiesCount: {
            $size: {
              $filter: {
                input: { $ifNull: ['$allergies', []] },
                cond: { $eq: ['$$this.severity', 'severe'] }
              }
            }
          },
          chronicConditionsCount: {
            $size: {
              $filter: {
                input: { $ifNull: ['$medicalHistory', []] },
                cond: { $eq: ['$$this.status', 'chronic'] }
              }
            }
          },
          activeConditionsCount: {
            $size: {
              $filter: {
                input: { $ifNull: ['$medicalHistory', []] },
                cond: { $eq: ['$$this.status', 'active'] }
              }
            }
          },
          allergies: 1,
          medicalHistory: 1
        }
      },
      {
        $match: {
          $or: [
            { severeAllergiesCount: { $gte: 2 } },
            { chronicConditionsCount: { $gte: 2 } },
            {
              $and: [
                { severeAllergiesCount: { $gte: 1 } },
                { chronicConditionsCount: { $gte: 1 } }
              ]
            }
          ]
        }
      },
      {
        $addFields: {
          riskScore: {
            $add: [
              { $multiply: ['$severeAllergiesCount', 3] },
              { $multiply: ['$chronicConditionsCount', 2] },
              '$activeConditionsCount'
            ]
          }
        }
      },
      { $sort: { riskScore: -1 } }
    ]);

    res.json({
      success: true,
      atRiskPatients,
      totalAtRisk: atRiskPatients.length
    });

  } catch (error) {
    logger.error('Get patients at risk error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching at-risk patients'
    });
  }
};