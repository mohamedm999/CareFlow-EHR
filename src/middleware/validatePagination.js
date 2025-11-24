export const validatePagination = (req, res, next) => {
  let { page = 1, limit = 20, sort } = req.query;
  
  page = Math.max(1, parseInt(page) || 1);
  limit = Math.min(100, Math.max(1, parseInt(limit) || 20));
  
  if (isNaN(page) || isNaN(limit)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid pagination parameters',
      details: 'page and limit must be valid numbers'
    });
  }
  
  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
    sort: sort || '-createdAt'
  };
  
  next();
};
