export const POPULATE_FIELDS = [
  { path: 'assignedUsers', select: 'firstName lastName email role' }
];

export const POPULATE_BASIC = [
  { path: 'assignedUsers', select: 'firstName lastName email' }
];

export const buildPharmacyFilter = (query) => {
  const filter = {};

  if (query.query) {
    filter.$or = [
      { name: { $regex: query.query, $options: 'i' } },
      { 'address.street': { $regex: query.query, $options: 'i' } },
      { 'address.city': { $regex: query.query, $options: 'i' } }
    ];
  }

  if (query.city) filter['address.city'] = { $regex: query.city, $options: 'i' };
  if (query.postalCode) filter['address.postalCode'] = query.postalCode;
  if (query.type) filter.type = query.type;
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true';
  if (query.partnershipStatus) filter.partnershipStatus = query.partnershipStatus;
  if (query.services) filter.services = query.services;
  if (query.canDispenseControlledSubstances !== undefined) filter.canDispenseControlledSubstances = query.canDispenseControlledSubstances === 'true';
  if (query.acceptsInsurance !== undefined) filter.acceptsInsurance = query.acceptsInsurance === 'true';

  if (query.latitude && query.longitude) {
    const lat = parseFloat(query.latitude);
    const lon = parseFloat(query.longitude);
    const maxDistanceKm = parseFloat(query.maxDistance || 10);
    filter['address.coordinates'] = {
      $geoWithin: {
        $centerSphere: [[lon, lat], maxDistanceKm / 6378.1]
      }
    };
  }

  return filter;
};

export const calculateDistances = (pharmacies, latitude, longitude) => {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  return pharmacies.map(pharmacy => {
    const pharmacyObj = pharmacy.toObject();
    if (pharmacy.address?.coordinates?.latitude && pharmacy.address?.coordinates?.longitude) {
      pharmacyObj.distance = pharmacy.calculateDistance(lat, lon);
    }
    return pharmacyObj;
  });
};

export const sortByDistance = (pharmacies, sortOrder = 'asc') => {
  return pharmacies.sort((a, b) => {
    const distA = a.distance || Infinity;
    const distB = b.distance || Infinity;
    return sortOrder === 'asc' ? distA - distB : distB - distA;
  });
};

export const buildStatsAggregation = () => ({
  byType: [
    { $group: { _id: '$type', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ],
  byPartnershipStatus: [
    { $group: { _id: '$partnershipStatus', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]
});
