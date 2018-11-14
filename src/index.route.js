const express = require('express');
// const userRoutes = require('./server/user/user.route');
// const authRoutes = require('./server/auth/auth.route');
const metricsRoutes = require('./server/metrics-proof/metricProof.route');
const billsRoutes = require('./server/BillStore/billStore.route')

const router = express.Router(); // eslint-disable-line new-cap

// TODO: use glob to match *.route files

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) =>
  res.send('OK')
);

// mount metrics routes at /metrics
router.use('/metrics', metricsRoutes);

//Mount billing routes at /bills
router.use('/bills', billsRoutes);

module.exports = router;
