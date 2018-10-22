import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import { checkMetric, backupMetric } from './metricProof.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/save-proof')
  /** POST /api/metrics/save-proof - Validate and save IPFS proof */
  .post(
    validate(paramValidation.singleMetric),
    checkMetric,
    backupMetric
  );

module.exports = router;
