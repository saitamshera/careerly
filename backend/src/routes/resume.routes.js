const express = require('express');
const multer = require('multer');
const { protect } = require('../middlewares/auth.middleware');
const {
  uploadResume,
  analyzeResume,
  listResumes,
  getResume,
  deleteResume,
  listReports,
  getResumeReports,
  getLatestReport
} = require('../controllers/resume.controller');

const resumeRoutes = express.Router();
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    const validExtension = /\.(pdf|docx|PDF|DOCX)$/.test(file.originalname || '');
    if (allowedMimeTypes.has(file.mimetype) && validExtension) return callback(null, true);
    return callback(new Error('Only PDF and DOCX resume files are allowed.'));
  }
});

resumeRoutes.use(protect);

resumeRoutes.post('/upload', upload.single('resume'), uploadResume);
resumeRoutes.post('/analyze', upload.single('resume'), analyzeResume);

resumeRoutes.get('/', listResumes);
resumeRoutes.get('/reports/latest', getLatestReport);
resumeRoutes.get('/reports', listReports);
resumeRoutes.get('/:id', getResume);
resumeRoutes.get('/:id/reports', getResumeReports);
resumeRoutes.delete('/:id', deleteResume);

module.exports = { resumeRoutes };
