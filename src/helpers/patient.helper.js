export const POPULATE_FIELDS = [
  { path: 'user', select: 'firstName lastName email phone dateOfBirth gender address' }
];

export const POPULATE_BASIC = [
  { path: 'user', select: 'firstName lastName email phone' }
];

export const ALLOWED_PATIENT_UPDATES = ['emergencyContact', 'consents'];

export const buildPatientFilter = async (query, User) => {
  const filter = {};

  if (query.bloodType) filter.bloodType = query.bloodType;

  if (query.search) {
    const users = await User.find({
      $or: [
        { firstName: { $regex: query.search, $options: 'i' } },
        { lastName: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } }
      ]
    }).select('_id');
    filter.user = { $in: users.map(u => u._id) };
  }

  return filter;
};

export const canAccessPatient = (patient, userId, userRole) => {
  if (['admin', 'secretary', 'doctor'].includes(userRole)) return true;
  return userRole === 'patient' && patient.user._id.toString() === userId;
};

export const canUpdatePatient = (patient, userId, userRole) => {
  if (['admin', 'secretary', 'doctor'].includes(userRole)) return true;
  return userRole === 'patient' && patient.user.toString() === userId;
};

export const validatePatientUpdates = (updates, userRole) => {
  if (userRole !== 'patient') return true;
  const requestedUpdates = Object.keys(updates);
  return requestedUpdates.every(key => ALLOWED_PATIENT_UPDATES.some(allowed => key.startsWith(allowed)));
};

export const buildStatsAggregation = () => ({
  totalPatients: [{ $count: 'count' }],
  byBloodType: [
    { $group: { _id: '$bloodType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ],
  withAllergies: [
    { $match: { 'allergies.0': { $exists: true } } },
    { $count: 'count' }
  ],
  withActiveConditions: [
    { $match: { 'medicalHistory.status': 'active' } },
    { $count: 'count' }
  ],
  commonAllergies: [
    { $unwind: '$allergies' },
    {
      $group: {
        _id: '$allergies.allergen',
        count: { $sum: 1 },
        severeCases: { $sum: { $cond: [{ $eq: ['$allergies.severity', 'severe'] }, 1, 0] } }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ],
  commonConditions: [
    { $unwind: '$medicalHistory' },
    { $match: { 'medicalHistory.status': 'active' } },
    { $group: { _id: '$medicalHistory.condition', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ],
  withInsurance: [
    { $match: { 'insurance.provider': { $exists: true, $ne: null } } },
    { $count: 'count' }
  ],
  consentStats: [
    {
      $group: {
        _id: null,
        dataSharing: { $sum: { $cond: ['$consents.dataSharing', 1, 0] } },
        treatmentConsent: { $sum: { $cond: ['$consents.treatmentConsent', 1, 0] } }
      }
    }
  ]
});

export const buildBloodTypeAggregation = () => [
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
          name: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
          email: '$userInfo.email',
          phone: '$userInfo.phone',
          hasAllergies: { $cond: [{ $gt: [{ $size: { $ifNull: ['$allergies', []] } }, 0] }, true, false] },
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
];

export const buildAllergyAnalyticsAggregation = () => [
  { $unwind: '$allergies' },
  {
    $group: {
      _id: { allergen: '$allergies.allergen', severity: '$allergies.severity' },
      count: { $sum: 1 },
      patients: { $push: { patientId: '$_id', notes: '$allergies.notes' } }
    }
  },
  {
    $group: {
      _id: '$_id.allergen',
      totalCases: { $sum: '$count' },
      severityBreakdown: { $push: { severity: '$_id.severity', count: '$count' } },
      mildCases: { $sum: { $cond: [{ $eq: ['$_id.severity', 'mild'] }, '$count', 0] } },
      moderateCases: { $sum: { $cond: [{ $eq: ['$_id.severity', 'moderate'] }, '$count', 0] } },
      severeCases: { $sum: { $cond: [{ $eq: ['$_id.severity', 'severe'] }, '$count', 0] } }
    }
  },
  { $sort: { totalCases: -1 } }
];

export const buildConditionsTrendsAggregation = (status) => [
  { $unwind: '$medicalHistory' },
  { $match: { 'medicalHistory.status': status } },
  {
    $group: {
      _id: '$medicalHistory.condition',
      count: { $sum: 1 },
      averageDuration: {
        $avg: {
          $divide: [
            { $subtract: [new Date(), '$medicalHistory.diagnosedDate'] },
            1000 * 60 * 60 * 24
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
];

export const buildDemographicsAggregation = () => [
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
          1000 * 60 * 60 * 24 * 365
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
        withInsurance: { $sum: { $cond: ['$hasInsurance', 1, 0] } },
        bloodTypes: { $push: '$bloodType' }
      }
    }
  }
];

export const buildAtRiskAggregation = () => [
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
      name: { $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName'] },
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
];
