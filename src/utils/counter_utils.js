import moment from 'moment';
import _ from 'lodash';

const getOldestByDate = (groupByDate) => {
  const computation = {
    raw_timestamp_unix: 0,
    raw_timestamp_iso: "",
    watts_consumed: 0,
    watts_produced: 0
  };

  const latest_metric = _.maxBy(groupByDate, 'metrics.timestamp');

  computation.watts_consumed = latest_metric.metrics.watts_consumed;
  computation.watts_produced = latest_metric.metrics.watts_produced;
  computation.raw_timestamp_unix = latest_metric.metrics.timestamp;
  computation.raw_timestamp_iso = moment.unix(latest_metric.metrics.timestamp);
  return computation;
}

_.mixin({
  log: function(arg) {
    console.log(arguments);
    return arg;
  }
});

const getCounterMetricsByTimeUnit = (rawMetrics, timeUnit) => {
    console.log(rawMetrics)
    const groupedMetrics = _(rawMetrics)
      // Group list of metrics into an array of lists, grouped by a interval of date (by day, weekIso, month, quarter, year)
      .groupBy(
        (result) => moment.unix(result.metrics.timestamp).endOf(timeUnit)
      )
      .values()
      // For each group, retrieve the latest metric by date, and do the difference with the latest of the previous group.
      .reduce(
        (result, current, index) => {
          const latest = getOldestByDate(current);
          console.log("LATEST OF", index, JSON.stringify(latest));
          // Index 0 will be the base from calculate further metrics
          if (index == 0) {
            return ({
              measurements: [],
              rawMetrics: [latest]
            });
          } 
          const priorRawMetric = result.rawMetrics[index - 1];
          const computed_metric = {
            watts_consumed: 0,
            watts_produced: 0,
            watts_surplus: 0,
            timestamp: ''
          }
          computed_metric.watts_consumed = latest.watts_consumed - priorRawMetric.watts_consumed;
          computed_metric.watts_produced = latest.watts_produced - priorRawMetric.watts_produced;
          computed_metric.watts_surplus = computed_metric.watts_produced - computed_metric.watts_consumed;
          computed_metric.watts_surplus = computed_metric.watts_surplus <= 0 ? 0 : computed_metric.watts_surplus;
          computed_metric.timestamp = latest.raw_timestamp_iso;
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
    return groupedMetrics.measurements;
}

export {
  getOldestByDate,
  getCounterMetricsByTimeUnit
}