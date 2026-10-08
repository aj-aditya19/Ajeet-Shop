const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const env = require('./config/env');
const routes = require('./routes');
const { globalLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || env.clientUrls.includes(origin)),
    credentials: true,
  })
);
app.use(globalLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
