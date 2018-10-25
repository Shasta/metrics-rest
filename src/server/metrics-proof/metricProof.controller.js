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
      return moment().subtract(15, 'days').startOf('day');
    case 'month':
      // Last 3 months
      return moment().subtract(6, 'months').startOf('month');
    case 'week':
      // Last 4 weeks 
      return moment().subtract(5, 'weeks').startOf('weekIso');
    case 'year':
      // Last 2 years
      return moment().subtract(3, 'years').startOf('year');
    case 'quarter':
      // Last 4 quarters
      return moment().subtract(5, 'quarter').startOf('quarter');
    default:
      return moment().subtract(14, 'days').startOf('day');
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
  const from = getDefaultSince(by);
  const to = moment().endOf(byMomentIso).unix();

  console.log(from.unix())
  console.log(to)
  try {
    const raw_metrics = await MetricProof
      .find({
        hardware_id: hwId,
        'metrics.timestamp': {
          $gte: from.unix(),
          $lte: to
        }
      })
      .sort({'metrics.timestamp': 'asc'})
      .limit(2000);

    const counterData = raw_metrics.map(raw => _.omit(getMetricProof(raw), 'hardware_id'));
    const metricsPerTimeUnit = getCounterMetricsByTimeUnit(counterData, byMomentIso);
    
    return res.send({
      hardware_id: hwId,
      unit_of_time: by,
      history_by_unit: metricsPerTimeUnit,
    });
  } catch(rawError) {
    console.error(rawError);
    const dbError = new APIError('Error while retrieving data from DB.')
    return next(dbError);
  }
}

const getCurrentMonth = async (req, res, next) => {
  const hwId = req.query.hardware_id;

  const currentMonth = moment().startOf('month').unix();

  try {
    const latestThisMonth = await MetricProof.find({
      hardware_id: hwId,
      'metrics.timestamp': {
        $gte: currentMonth
      }
    })
    .sort({'metrics.timestamp': 'desc'})
    .limit(1);

    const latestPriorMonth = await MetricProof.find({
        hardware_id: hwId,
        'metrics.timestamp': {
          $lt: currentMonth
        }
      })
      .sort({'metrics.timestamp': 'desc'})
      .limit(1);

    // Calculate the difference between the first and latest day in this month
    if (!!latestPriorMonth.length && !!latestThisMonth.length) {
      const firstMetrics = latestPriorMonth[0].metrics;
      const latestMetrics = latestThisMonth[0].metrics;

      const monthConsumption = latestMetrics.watts_consumed - firstMetrics.watts_consumed;
      const monthProduction = latestMetrics.watts_produced - firstMetrics.watts_produced;
      let monthSurplus = monthProduction - monthConsumption;
      monthSurplus = monthSurplus <= 0 ? 0 : monthSurplus;

      return res.send({
        hardware_id: hwId,
        metrics: {
          watts_consumed: monthConsumption,
          watts_produced: monthProduction,
          watts_surplus: monthSurplus,
        }
      });
    }
    // If there is no records in the prior month, this is the first month. Show data from latest record.
    if (!latestPriorMonth.length && !!latestThisMonth.length) {
      const firstMonth = latestThisMonth[0].metrics;
      const firstMonthSurplus = firstMonth.watts_produced - firstMonth.watts_consumed;

      return res.send({
        hardware_id: hwId,
        metrics: {
          watts_consumed: firstMonth.watts_consumed,
          watts_produced: firstMonth.watts_produced,
          watts_surplus: firstMonthSurplus
        }
      });
    }
    // No documents found regarding this hardware id
    return res.send({
      hardware_id: hwId,
      metrics: {
        watts_consumed: 0,
        watts_produced: 0,
        watts_surplus: 0,
      }
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
  getCurrentMonth
}