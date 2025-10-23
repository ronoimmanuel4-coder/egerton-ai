const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Create upload directories
const uploadDirs = {
  videos: path.join(__dirname, '../uploads/videos'),
  notes: path.join(__dirname, '../uploads/notes'),
  assessments: path.join(__dirname, '../uploads/assessments')
};

Object.values(uploadDirs).forEach(ensureDirectoryExists);

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    
    // Handle specific field names
    switch (file.fieldname) {
      case 'lectureVideo':
        uploadPath = uploadDirs.videos;
        break;
      case 'notes':
        uploadPath = uploadDirs.notes;
        break;
      case 'assessment':
        uploadPath = uploadDirs.assessments;
        break;
      case 'file':
        // For generic 'file' field, determine directory based on request URL
        if (req.originalUrl.includes('/upload/video')) {
          uploadPath = uploadDirs.videos;
        } else if (req.originalUrl.includes('/upload/notes')) {
          uploadPath = uploadDirs.notes;
        } else if (req.originalUrl.includes('/upload/assessment')) {
          uploadPath = uploadDirs.assessments;
        } else {
          uploadPath = path.join(__dirname, '../uploads/misc');
          ensureDirectoryExists(uploadPath);
        }
        break;
      default:
        uploadPath = path.join(__dirname, '../uploads/misc');
        ensureDirectoryExists(uploadPath);
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    lectureVideo: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'],
    notes: ['application/pdf'],
    assessment: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'],
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
  };

  let fieldAllowedTypes;
  
  // Handle specific field names
  if (allowedTypes[file.fieldname]) {
    fieldAllowedTypes = allowedTypes[file.fieldname];
  } else if (file.fieldname === 'file') {
    // For generic 'file' field, determine allowed types based on request URL
    if (req.originalUrl.includes('/upload/video')) {
      fieldAllowedTypes = allowedTypes.lectureVideo;
    } else if (req.originalUrl.includes('/upload/notes')) {
      fieldAllowedTypes = allowedTypes.notes;
    } else if (req.originalUrl.includes('/upload/assessment')) {
      fieldAllowedTypes = allowedTypes.assessment;
    } else {
      // Allow all types for generic uploads
      fieldAllowedTypes = [...allowedTypes.lectureVideo, ...allowedTypes.notes, ...allowedTypes.assessment];
    }
  }
  
  if (fieldAllowedTypes && fieldAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${file.fieldname}. Allowed types: ${fieldAllowedTypes?.join(', ')}`), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
    fieldSize: 10 * 1024 * 1024, // 10MB max field size
    files: 1 // Maximum number of files
  }
});

// Custom middleware to handle different file size limits
const uploadWithLimits = (req, res, next) => {
  const dynamicUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: (() => {
        if (req.body.fileType === 'lectureVideo') return 500 * 1024 * 1024; // 500MB
        if (req.body.fileType === 'notes') return 10 * 1024 * 1024; // 10MB
        if (req.body.fileType === 'assessment') return 5 * 1024 * 1024; // 5MB
        return 10 * 1024 * 1024; // Default 10MB
      })()
    }
  });

  dynamicUpload.single('file')(req, res, next);
};

// Multiple file upload configurations
const uploadFields = upload.fields([
  { name: 'lectureVideo', maxCount: 1 },
  { name: 'notes', maxCount: 1 },
  { name: 'assessment', maxCount: 1 }
]);

// Single file upload
const uploadSingle = upload.single('file');
const uploadVideo = upload.single('lectureVideo');
const uploadNotes = upload.single('notes');
const uploadAssessment = upload.single('assessment');

// Error handling middleware
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File too large',
        maxSize: {
          video: '500MB',
          pdf: '10MB',
          image: '5MB'
        }
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files uploaded'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      message: error.message
    });
  }
  
  next(error);
};

module.exports = {
  upload,
  uploadFields,
  uploadSingle,
  uploadVideo,
  uploadNotes,
  uploadAssessment,
  uploadWithLimits,
  handleUploadError,
  uploadDirs
};
