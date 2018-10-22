import _ from 'lodash';
import { ipfs } from '../../config/ipfs';
import APIError from '../helpers/APIError';
// Model
import MetricProof from './metricProof.model';

const getMetricProof = rawMetric => {
  const metricProof = _.pick(rawMetric, ['hardware_id', 'ipfs_hash'])
  metricProof.metrics = _.pick(rawMetric.metrics, ['watts_consumed', 'watts_produced', 'timestamp'])
  
  return metricProof;
}

const checkMetric = async (req, res, next) => {
  const metricProof = getMetricProof(req.body);
  let multihashResult = [];
  if (!ipfs.util.isIPFS.multihash(metricProof.ipfs_hash)) {
    const invalidHash = new APIError("IPFS hash not valid", "400", true);
    return next(invalidHash);
  }
  const metricsBuffer = Buffer.from(JSON.stringify(metricProof.metrics))
  try {
    multihashResult = await ipfs.add(metricsBuffer, { onlyHash: true });
  } catch(_error) {
    const hashingError = new APIError('Error while multihash', 400, false);
    throw hashingError;
  }

  if (multihashResult.length !== 1 || !(_.has(multihashResult[0], 'hash'))) {
    const invalidResult = new APIError('Multihash result error', 400, false);
    throw invalidResult;
  }
  const metricsChecksum = _.get(multihashResult[0], 'hash', '');
  if (!metricsChecksum || metricsChecksum !== metricProof.ipfs_hash) {
    const invalidChecksum = new APIError("The metrics body does not match with multihash checksum", "400", true)
    return next(invalidChecksum)
  }
  req.metricProof = _.cloneDeep(metricProof);
  return next();
}

const backupMetric = async (req, res, next) => {
  if (!req.metricProof) {
    const invalidMetric = new APIError("Error while validating metric", "400", true)
    return next(invalidMetric);
  }
  const metricInstance = new MetricProof(req.metricProof);
  try {
    await metricInstance.save()
  } catch(rawError) {
    console.error(rawError);
    const dbError = new APIError('Error while saving to DB.')
    return next(dbError);
  }
  res.send({status: "ok", message: 'backup-saved'})
}

export {
  checkMetric,
  backupMetric
}