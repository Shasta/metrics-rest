import _ from 'lodash';
import { ipfs } from '../../config/ipfs';
import APIError from '../helpers/APIError';
// Model
import MetricProof from './metricProof.model';

const getMetricProof = rawMetric => {
  const metricProof = _.pick(rawMetric, ['hardware_id', 'ipfs_hash'])
  metricProof.metrics = _.pick(rawMetric.metrics, ['timestamp', 'watts_consumed', 'watts_produced'])
  
  return metricProof;
}

const checkMetric = async (req, res, next) => {
  const metricProof = getMetricProof(req.body);
  let multihashResult = [];
  if (!ipfs.util.isIPFS.multihash(metricProof.ipfs_hash)) {
    const invalidHash = new APIError('IPFS hash not valid', 400, true);
    return next(invalidHash);
  }
  const metricsBuffer = Buffer.from(JSON.stringify(metricProof.metrics), 'ascii')
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

const getMetricHistory = async (req, res, next) => {
  const hwId = req.query.hardware_id;
  try {
    const raw_metrics = await MetricProof.find({hardware_id: hwId}).sort({createdAt: 'desc'});
    const metrics = raw_metrics.map(raw => _.omit(getMetricProof(raw), 'hardware_id'));
    return res.send({
      hardware_id: hwId,
      metrics
    })
  } catch(rawError) {
    console.error(rawError);
    const dbError = new APIError('Error while retrieving data from DB.')
    return next(dbError);
  }
}

const getCurrentMetrics = async (req, res, next) => {
  const hwId = req.query.hardware_id;
  try {
    const aggregation = [
      {
        $match: {
          hardware_id: hwId
        }
      },
      {
        $group: {
          _id: null,
          hardware_id: {
            $first: '$hardware_id'
          },
          watts_produced: {
            $sum: "$metrics.watts_produced"
          },
          watts_consumed: {
            $sum: '$metrics.watts_consumed'
          }
        }
      }, {
        $project: {
          hardware_id: 1,
          watts_consumed: 1,
          watts_produced: 1,
          watts_surplus: {
            $substract: ['$watts_consumed', '$watts_produced']
          }
        }
      }
    ]
    const total_metrics = await MetricProof.aggregate(aggregation);
    console.log('hw_metrics', total_metrics);
    return res.send(total_metrics);
  } catch(rawError) {
    console.error(rawError);
    const dbError = new APIError('Error while retrieving data from DB.')
    return next(dbError);
  }
}

export {
  checkMetric,
  backupMetric,
  getMetricHistory,
  getCurrentMetrics,
}