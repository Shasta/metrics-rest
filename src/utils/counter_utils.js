import moment from 'moment';
import _ from 'lodash';

/*
  Retrieve the latest item in an array of metrics of the same timestamp unit (metrics from same day or month or year or quarter)
*/
const getOldestByDate = (groupByDate) => {
  const computation = {
    timestamp: 0,
    watts_consumed: 0,
    watts_produced: 0
  };

  const latest_metric = _.maxBy(groupByDate, 'metrics.timestamp');
  return latest_metric.metrics;
}

// Compute the metrics history by unit timeframe
const computeHistoryData = (groupedMetrics, noPriorData) => {
  return _.chain(groupedMetrics)
    .reduce((result, current, index) => {
      const latest = getOldestByDate(current);
      // Index 0 will be the base from calculate further metrics
      if (index == 0) {
        if (noPriorData) {
          const firstMetric = {
            watts_consumed: latest.watts_consumed,
            watts_produced: latest.watts_produced,
            watts_surplus: 0,
            timestamp_unix: latest.timestamp,
            timestamp_iso: moment.unix(latest.timestamp)
          }
          // Calculate surplus of current unit timeframe
          firstMetric.watts_surplus = firstMetric.watts_produced - firstMetric.watts_consumed;
          firstMetric.watts_surplus = firstMetric.watts_surplus <= 0 ? 0 : firstMetric.watts_surplus;
          return ({
            measurements: [firstMetric],
            rawMetrics: [latest]
          });
        }
        return ({
          measurements: [],
          rawMetrics: [latest]
        });
      }
      // Get the prior metric as a reference to calculate the difference during the unit timeframe
      const priorRawMetric = result.rawMetrics[index - 1];

      // Calculate the computed metrics, add ISO timestamp field
      const computed_metric = {
        watts_consumed: latest.watts_consumed - priorRawMetric.watts_consumed,
        watts_produced: latest.watts_produced - priorRawMetric.watts_produced,
        watts_surplus: 0,
        timestamp_unix: latest.timestamp,
        timestamp_iso: moment.unix(latest.timestamp)
      }
      // Calculate surplus of current unit timeframe
      computed_metric.watts_surplus = computed_metric.watts_produced - computed_metric.watts_consumed;
      computed_metric.watts_surplus = computed_metric.watts_surplus <= 0 ? 0 : computed_metric.watts_surplus;

      return ({
        measurements: [...result.measurements, ...[computed_metric]],
        rawMetrics: [...result.rawMetrics, ...[latest]]
      });
    },
    {
      measurements: [],
      rawMetrics: []
    }
  )
  .thru( x => {
    return _.get(x, 'measurements', []);
  })
  .value()
}

// Main function for grouping metrics by a timeframe (day, month, quarter, year) and retrieve the metrics during each timeframe (watts consumption/production/surplus from a month, for example)
const getCounterMetricsByTimeUnit = (rawMetrics, timeUnit, noPriorData) => {
    const groupedMetrics = _(rawMetrics)
      // Group list of metrics into an array of lists, grouped by a interval of date (by day, weekIso, month, quarter, year)
      .groupBy(
        (result) => moment.unix(result.metrics.timestamp).endOf(timeUnit)
      )
      .values()
      .value();
    // For each group, retrieve the latest metric by date, and do the difference with the latest of the previous month group.
    return computeHistoryData(groupedMetrics, noPriorData)
}

export {
  getOldestByDate,
  getCounterMetricsByTimeUnit
}