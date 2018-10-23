import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import { whitelistHardware, enableFakeMetrics, stopFakeMetrics, isWhitelisted } from './metricProof.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/whitelist')
  /** POST /api/hardware/start - Validate and save IPFS proof */
  .post(
    validate(paramValidation.hardware),
    whitelistHardware,
    enableFakeMetrics
  );

router.route('/start')
  /** POST /api/hardware/start - Start making fake data */
  .post(
    validate(paramValidation.hardware),
    isWhitelisted,
    enableFakeMetrics
  );

router.route('/stop')
  /** POST /api/hardware/stop - Stop making fake data */
  .post(
    validate(paramValidation.hardware),
    isWhitelisted,
    stopFakeMetrics
  );

module.exports = router;
