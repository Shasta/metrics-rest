import express from 'express';
import validate from 'express-validation';
import paramValidation from '../../config/param-validation';
import { checkProof, backupProof} from './metricProof.controller';

const router = express.Router(); // eslint-disable-line new-cap

router.route('/backup')
  /** POST /api/users - Create new user */
  .post(
    validate(paramValidation.proofValidation),
    checkProof,
    backupProof
  );

module.exports = router;
