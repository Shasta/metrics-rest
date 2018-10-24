import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import { checkMetric, backupMetric, getMetricHistory, getCurrentMetrics } from './metricProof.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/save-proof')
  /** POST /api/metrics/save-proof - Validate and save IPFS proof */
  .post(
    validate(paramValidation.singleMetric),
    checkMetric,
    backupMetric
  );

  router.route('/history')
  /** GET /api/metrics/getConsumption - Retrieve historic conumption of a hardware */
  .get(
    validate(paramValidation.getHistoric),
    getMetricHistory
  );

  router.route('/current')
  /** GET /api/metrics/getConsumption - Retrieve historic conumption of a hardware */
  .get(
    validate(paramValidation.getHistoric),
    getCurrentMetrics
  );
module.exports = router;
