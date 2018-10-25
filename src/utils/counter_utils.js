import moment from 'moment';
import _ from 'lodash';

const getOldestByDate = (groupByDate, timestamp) => {
  const computation = {
    timestamp: timestamp,
    watts_consumed: 0,
    watts_produced: 0
  };

  const latest_metric = _.maxBy(groupByDate, 'metrics.timestamp');

  computation.watts_consumed = latest_metric.metrics.watts_consumed;
  computation.watts_produced = latest_metric.metrics.watts_produced;

  return computation;
}

const getCounterMetricsByTimeUnit = (rawMetrics, timeUnit) => _(rawMetrics)
      // Group list of metrics into an array of lists, grouped by a interval of date (by day, weekIso, month, quarter, year)
      .groupBy(
        (result) => moment.unix(result.metrics.timestamp).startOf(timeUnit)
      )
      // For each group, retrieve the latest metric by date, and do the difference with the latest of the previous group.
      .reduce(
        (result, current, key) => {
          const index = result.index;
          
          const latest = getOldestByDate(current, key);
          if (index == 0) {
            result.index += 1;
            result.data = [latest];
            return result;
          }
          if (index > 0) {
            const priorMetric = result.data[index - 1];
            latest.watts_consumed = latest.watts_consumed - priorMetric.watts_consumed;
            latest.watts_produced = latest.watts_produced - priorMetric.watts_produced;
            latest.watts_surplus = latest.watts_produced - latest.watts_consumed;
            latest.watts_surplus = latest.watts_surplus <= 0 ? 0 : latest.watts_surplus;
            result.data.push(latest)
            result.index += 1;
            return result;
          }
          
        },
        { index: 0, data: [] }
      )

export {
  getOldestByDate,
  getCounterMetricsByTimeUnit
}