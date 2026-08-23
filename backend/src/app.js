const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const { env } = require('./config/env');
const { authRoutes } = require('./routes/auth.routes');
const { dashboardRoutes } = require('./routes/dashboard.routes');
const { jobsRoutes } = require('./routes/jobs.routes');
const { aiRoutes } = require('./routes/ai.routes');
const { resumeRoutes } = require('./routes/resume.routes');
const { dsaRoutes } = require('./routes/dsa.routes');
const { codingProfileRoutes } = require('./routes/codingProfile.routes');
const { leetcodeRoutes } = require('./routes/leetcode.routes');
const { githubRoutes } = require('./routes/github.routes');
const { gmailRoutes } = require('./routes/gmail.routes');
const { profileRoutes } = require('./routes/profile.routes');
const readinessRoutes = require('./routes/readiness.routes');
const { activityRoutes } = require('./routes/activity.routes');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();
app.use(helmet());

// Support multiple CORS origins (comma-separated CLIENT_URL)
const allowedOrigins = env.CLIENT_URL.split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(
  express.json({
    limit: '2mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 }));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok', service: 'placement-companion-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/dsa', dsaRoutes);
app.use('/api/coding-profiles', codingProfileRoutes);
app.use('/api/leetcode', leetcodeRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/gmail', gmailRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/readiness', readinessRoutes);
app.use('/api/activity', activityRoutes);

app.use(errorHandler);

module.exports = { app };