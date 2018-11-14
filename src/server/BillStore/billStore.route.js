import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import { getBill } from './billStore.controller';

const router = express.Router(); // eslint-disable-line new-cap

  router.route('/getBill')
    /** GET /api/metrics/counter-history - Retrieve historic counter metrics of a hardware */
    .get(
      validate(paramValidation.getHistoric),
      getBill
    );

module.exports = router;