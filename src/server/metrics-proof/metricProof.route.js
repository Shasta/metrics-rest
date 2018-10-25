import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import { checkMetric, backupMetric, getRawMetricHistory, getCurrentRawMetrics, getMetricHistoryBy } from './metricProof.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/save-proof')
  /** POST /api/metrics/save-proof - Validate and save IPFS proof */
  .post(
    validate(paramValidation.singleMetric),
    checkMetric,
    backupMetric
  );

  router.route('/history')
    /** GET /api/metrics/history - Retrieve historic conumption of a hardware */
    .get(
      validate(paramValidation.getHistoric),
      getRawMetricHistory
    );

  router.route('/current')
    /** GET /api/metrics/current - Retrieve historic conumption of a hardware */
    .get(
      validate(paramValidation.getHistoric),
      getCurrentRawMetrics
    );
  
  router.route('/by-unit-time')
    /** GET /api/metrics/by-unit-time - Retrieve metrics of consumption, production and surplus by unit of time (by day, weekIso, month, year) */
    .get(
      validate(paramValidation.getHistoricByUnit),
      getMetricHistoryBy
    );
module.exports = router;
