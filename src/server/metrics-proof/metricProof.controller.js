import _ from 'lodash';
import { ipfs } from '../../config/ipfs';
import ipfsHashFromString from '../../utils/ipfs_hash';
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
  let metricsChecksum = '';
  if (!ipfs.util.isIPFS.multihash(metricProof.ipfs_hash)) {
    const invalidHash = new APIError('IPFS hash not valid', 400, true);
    return next(invalidHash);
  }
  try {
    metricsChecksum = await ipfsHashFromString(JSON.stringify(metricProof.metrics));
  } catch(_error) {
    console.error('error', _error)
    const hashingError = new APIError('Error while multihash', 400, false);
    return next(hashingError)
  }

  console.log('compare hashes', metricProof.ipfs_hash, metricsChecksum)
  if (!metricsChecksum.length ||  metricsChecksum !== metricProof.ipfs_hash) {
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
    });
  } catch(rawError) {
    console.error(rawError);
    const dbError = new APIError('Error while retrieving data from DB.')
    return next(dbError);
  }
}

const getCurrentMetrics = async (req, res, next) => {
  const hwId = req.query.hardware_id;
  try {
    const latestRawMetric = await MetricProof.find().sort({'metrics.timestamp': -1}).limit(1);

    if (!latestRawMetric.length) {
      return res.send({
        hardware_id: hwId,
        ipfs_hash: '',
        metrics: {
          timestamp: 0,
          watts_consumed: 0,
          watts_produced: 0,
          watts_surplus: 0
        }
      })      
    }

    // Clean mongo fields
    const latestMetric = getMetricProof(latestRawMetric[0]);
    // Append watts_surplus
    const watts_surplus = latestMetric.metrics.watts_produced - latestMetric.metrics.watts_consumed
    latestMetric.metrics.watts_surplus = watts_surplus <= 0 ? 0 : watts_surplus;
    return res.send(latestMetric);
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

/** Saving query if needed in future
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
            $subtract: ['$watts_consumed', '$watts_produced']
          }
        }
      }
    ]
    const result = await MetricProof.aggregate(aggregation)
      .allowDiskUse(true)
      .cursor({})
      .exec()
      .toArray();
    */