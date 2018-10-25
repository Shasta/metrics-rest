import _ from 'lodash';
import moment from 'moment';
import { ipfs } from '../../config/ipfs';
import ipfsHashFromString from '../../utils/ipfs_hash';
import { getCounterMetricsByTimeUnit } from '../../utils/counter_utils';
import APIError from '../helpers/APIError';

// Model
import MetricProof from './metricProof.model';

const getMomentIso = byDate => {
  switch(byDate) {
    case 'day': 
      return 'day';
    case 'month':
      return 'month';
    case 'week': 
      return 'weekIso';
    case 'year':
      return 'year';
    case 'quarter':
      return 'quarter';
    default:
      return 'month';
  }
}

const getDefaultSince = byDate => {
  switch(byDate) {
    case 'day':
      // Last 14 days
      return moment().subtract(14, 'days');
    case 'month':
      // Last 3 months
      return moment().subtract(3, 'months');
    case 'week':
      // Last 4 weeks 
      return moment().subtract(4, 'weeks');
    case 'year':
      // Last 2 years
      return moment().subtract(2, 'years');
    case 'quarter':
      // Last 4 quarters
      return moment().subtract(4, 'quarter');
    default:
      return moment().subtract(14, 'days');
  }
};

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

const getRawMetricHistory = async (req, res, next) => {
  const hwId = req.query.hardware_id;
  try {
    const raw_metrics = await MetricProof.find({ hardware_id: hwId }).sort({'metrics.timestamp': 'desc'});
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

const getMetricHistoryBy = async (req, res, next) => {
  const hwId = req.query.hardware_id;
  const by = req.query.by;

  /*
    Not available for now. Only default values are show for now
    const from = req.query.from;
    const to = req.query.to;
  */

  const byMomentIso = getMomentIso(by);
  const since = getDefaultSince();
  try {
    const raw_metrics = await MetricProof
      .find({
        hardware_id: hwId,
        'metrics.timestamp': { $gte: since.unix() }
      })
      .sort({'metrics.timestamp': 'asc'})
      .limit(100);

    const counterData = raw_metrics.map(raw => _.omit(getMetricProof(raw), 'hardware_id'));
    const metricsPerTimeUnit = getCounterMetricsByTimeUnit(counterData, byMomentIso);

    return res.send({
      hardware_id: hwId,
      unit_of_time: by,
      history_by_unit: metricsPerTimeUnit.data,
    });
  } catch(rawError) {
    console.error(rawError);
    const dbError = new APIError('Error while retrieving data from DB.')
    return next(dbError);
  }
}

const getCurrentRawMetrics = async (req, res, next) => {
  const hwId = req.query.hardware_id;
  try {
    const latestRawMetric = await MetricProof.find({hardware_id: hwId}).sort({'metrics.timestamp': 'desc'}).limit(1);

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
  getRawMetricHistory,
  getCurrentRawMetrics,
  getMetricHistoryBy,
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