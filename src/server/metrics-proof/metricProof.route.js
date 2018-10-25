import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import { checkMetric, backupMetric, getRawMetricHistory, getCurrentRawMetrics, getMetricHistoryBy, getCurrentMonth } from './metricProof.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/save-proof')
  /** POST /api/metrics/save-proof - Validate and save IPFS proof */
  .post(
    validate(paramValidation.singleMetric),
    checkMetric,
    backupMetric
  );

  router.route('/counter-history')
    /** GET /api/metrics/counter-history - Retrieve historic counter metrics of a hardware */
    .get(
      validate(paramValidation.getHistoric),
      getRawMetricHistory
    );

  router.route('/counter')
    /** GET /api/metrics/counter - Retrieve the latest counter information of a hardware */
    .get(
      validate(paramValidation.getHistoric),
      getCurrentRawMetrics
    );

  router.route('/current-month')
    /** GET /api/metrics/current-month - Retrieve historic consumption of the current month */
    .get(
      validate(paramValidation.getHistoric),
      getCurrentMonth
    );

  router.route('/by-unit-time')
    /** GET /api/metrics/by-unit-time - Retrieve metrics of consumption, production and surplus by unit of time (by day, weekIso, month, year) */
    .get(
      validate(paramValidation.getHistoricByUnit),
      getMetricHistoryBy
    );
module.exports = router;
