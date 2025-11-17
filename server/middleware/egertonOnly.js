/**
 * Egerton-Only Middleware
 * Enforces single institution (Egerton University) throughout the application
 */

const EGERTON_CONFIG = require('../config/egerton');

/**
 * Middleware to inject Egerton institution ID into request
 * This ensures all queries are scoped to Egerton University only
 */
const injectEgertonContext = (req, res, next) => {
  // Add Egerton institution ID to request context
  if (EGERTON_CONFIG.database.institutionId) {
    req.egertonInstitutionId = EGERTON_CONFIG.database.institutionId;
  }
  
  // For requests that might include institution in query/body, override with Egerton
  if (EGERTON_CONFIG.middleware.enforceSingleInstitution) {
    // Override query params
    if (req.query && req.query.institution) {
      req.query.institution = EGERTON_CONFIG.database.institutionId;
    }
    
    // Override body params (for POST/PUT requests)
    if (req.body && req.body.institution) {
      req.body.institution = EGERTON_CONFIG.database.institutionId;
    }
  }
  
  next();
};

/**
 * Middleware to restrict institution-related endpoints
 * Prevents creation/modification of non-Egerton institutions
 */
const restrictInstitutionModification = (req, res, next) => {
  const method = req.method;
  const institutionId = req.params.id || req.body.institution || req.body._id;
  
  // Allow GET requests (viewing)
  if (method === 'GET') {
    return next();
  }
  
  // For POST/PUT/DELETE, check if it's Egerton
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    // If trying to modify/create institution, must be Egerton
    if (institutionId && institutionId !== EGERTON_CONFIG.database.institutionId) {
      return res.status(403).json({
        message: 'This platform is exclusively for Egerton University. Institution modifications are restricted.',
        institution: 'Egerton University',
      });
    }
    
    // For POST (creating new institution), block unless super admin
    if (method === 'POST' && req.path.includes('/institutions')) {
      // Check if user is super admin
      if (req.user?.role !== 'super_admin') {
        return res.status(403).json({
          message: 'This platform is exclusively for Egerton University. Creating new institutions is not allowed.',
          institution: 'Egerton University',
        });
      }
    }
  }
  
  next();
};

/**
 * Middleware to filter institution lists to Egerton only
 * Applied to GET /api/institutions endpoints
 */
const filterToEgertonOnly = (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method to filter institutions
  res.json = function(data) {
    if (data && data.institutions && Array.isArray(data.institutions)) {
      // Filter to Egerton only
      const egertonInstitutions = data.institutions.filter(inst => 
        inst.shortName === 'EGERTON' || 
        inst._id?.toString() === EGERTON_CONFIG.database.institutionId ||
        inst.id?.toString() === EGERTON_CONFIG.database.institutionId
      );
      
      return originalJson({
        ...data,
        institutions: egertonInstitutions,
        total: egertonInstitutions.length,
        filteredByInstitution: 'Egerton University',
      });
    }
    
    return originalJson(data);
  };
  
  next();
};

/**
 * Middleware to add Egerton branding to responses
 * Useful for API consumers to know they're on Egerton-only platform
 */
const addEgertonBranding = (req, res, next) => {
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method to add branding
  res.json = function(data) {
    // Add Egerton context to response
    const brandedData = {
      ...data,
      _platform: {
        institution: EGERTON_CONFIG.institution.name,
        shortName: EGERTON_CONFIG.institution.shortName,
        type: 'single-institution',
        features: {
          ai: EGERTON_CONFIG.ai.features,
        },
      },
    };
    
    return originalJson(brandedData);
  };
  
  next();
};

module.exports = {
  injectEgertonContext,
  restrictInstitutionModification,
  filterToEgertonOnly,
  addEgertonBranding,
};
