const mongoose = require('mongoose');
const request = require('supertest');
const httpStatus = require('http-status');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const expect = chai.expect;
const should = chai.should();
const app = require('../src/index');


import _ from 'lodash';
import { beforeCaseTests } from './test.config';
import { dailyMetricsBatch } from './fake_data.js';

chai.config.includeStack = true;

/**
 * root level hooks
 */
after((done) => {
  // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
  mongoose.models = {};
  mongoose.modelSchemas = {};
  mongoose.connection.close();
  done();
});

before(function (done) {
  setTimeout(async function () {
    await beforeCaseTests();
    done();
  }, 500);
});

describe('## Metric Proof APIs', () => {
  const hw_metrics = [
    {
      hardware_id: "1234",
      ipfs_hash: "Qmap9tTG8oXzpUBbTL1iG9pRV8JmSzXVVDe591Fx7pfRmy",
      metrics: {
        timestamp: 1540195373,
        watts_consumed: 1000,
        watts_produced: 230
      }
    },
    {
      hardware_id: "1234",
      ipfs_hash: "QmZ4GfGzvn6UB1isev1AsuYpnzKrsePqmwQkE5eL2pJxMr",
      metrics: {
        timestamp: 1540195378,
        watts_consumed: 1100,
        watts_produced: 1400
      }
    }
  ];

  const invalid_hash_metrics = {
    hardware_id: "1234",
    ipfs_hash: "invalid_hash",
    metrics: {
      timestamp: 1540195373,
      watts_consumed: 1000,
      watts_produced: 230
    }
  };

  const hardwareId = '1234';

  describe('# POST /api/metrics/save-proof', () => {
    it('should receive a valid metrics and save it to mongodb', () =>
      request(app)
        .post('/api/metrics/save-proof')
        .send(hw_metrics[0]) // Send the first tx
        .expect(httpStatus.OK)
        .then(async (res) => {
          expect(res.body.status).to.equal("ok");
          // Test if in DB is inserted.
        })
    );
    it('should receive an invalid ipfs hash and output an error', () =>
      request(app)
        .post('/api/metrics/save-proof')
        .send(invalid_hash_metrics)
        .expect(httpStatus.BAD_REQUEST)
        .then((res) => {
          expect(res.body.message).to.equal('IPFS hash not valid');
        })
    );
  });

  describe('# GET /api/metrics/counter-history', () => {
    it('should receive a valid response with the historic consumption', () =>
      request(app)
        .get('/api/metrics/counter-history')
        .query({ hardware_id: hardwareId })
        .expect(httpStatus.OK)
        .then((res) => {

          // Should have the next fields
          res.body.should.contain.keys('hardware_id', 'metrics');

          // Should expect values that are equal than the mockup
          expect(res.body.hardware_id).to.equal(hardwareId);
          res.body.metrics[0].should.be.deep.equal(_.omit(hw_metrics[0], 'hardware_id'))
        })
    );
  });

  describe('# GET /api/metrics/counter', function() {
    this.timeout(5000);

    const mockup_metrics = hw_metrics[1];

    it('should receive a valid response with the current consumption', async () => {
      // Add second metrics
      await request(app)
        .post('/api/metrics/save-proof')
        .send(mockup_metrics) // Send the first tx
        .expect(httpStatus.OK)
      // Retrieve current metrics
      await request(app)
        .get('/api/metrics/counter')
        .query({ hardware_id: hardwareId })
        .expect(httpStatus.OK)
        .then(async (res) => {
          const body = res.body;
          const metrics = _.get(body, 'metrics', {});

          console.log("metrics", JSON.stringify(body, null, 2));
          console.log("mockup", JSON.stringify(mockup_metrics, null, 2))
          // Check fields
          body.should.contain.keys('hardware_id', 'ipfs_hash', 'metrics');
          metrics.should.contain.keys('watts_consumed', 'watts_produced', 'watts_surplus');
          // Check values, should match second metrics (index is 1 at hw_metrics)
          metrics.watts_consumed.should.be.equal(mockup_metrics.metrics.watts_consumed)
          metrics.watts_produced.should.be.equal(mockup_metrics.metrics.watts_produced)

          // Check watts_surplus, value should be 0 or greater
          const surplus = _.get(metrics, 'watts_surplus', -1);
          surplus.should.be.gt(0);
          // Second metric surplus is 300
          const manual_surplus = mockup_metrics.metrics.watts_produced - mockup_metrics.metrics.watts_consumed
          surplus.should.be.equal(manual_surplus);
        })
    });
  });

  describe('# GET /api/metrics/by-unit-time', function() {
    const hw_id = '5555';
    const currentMonthBatch = dailyMetricsBatch(hw_id)

    it('should receive a valid response with the current consumption', async () => {
      // Add batch of metrics from hardware id 5555
      await Promise.map(
        currentMonthBatch,
        fakeMetric =>
          request(app)
            .post('/api/metrics/save-proof')
            .send(fakeMetric)
            .expect(httpStatus.OK)
      )
      // Retrieve history of metrics by day
      await request(app)
        .get('/api/metrics/by-unit-time')
        .query({
          hardware_id: hw_id,
          by: 'day'
        })
        .expect(httpStatus.OK)
        .then(async (res) => {
          console.log('RESULT BY DAILY', JSON.stringify(res.body))
          console.log('TODO: Make fake data with relative to current date, to be consistent and be able to check values without breaking every 14 days')
        })
    });
  });

  describe('# GET /api/metrics/current-month', function() {
    const hw_id = '6666';
    const currentMonthBatch = dailyMetricsBatch(hw_id)

    it('should receive a valid response with the current consumption', async () => {
      // Add batch of metrics from hardware id 6666
      await Promise.map(
        currentMonthBatch,
        fakeMetric =>
          request(app)
            .post('/api/metrics/save-proof')
            .send(fakeMetric)
            .expect(httpStatus.OK)
      )
      // Retrieve history of metrics by day
      await request(app)
        .get('/api/metrics/current-month')
        .query({
          hardware_id: hw_id,
        })
        .expect(httpStatus.OK)
        .then(async (res) => {
          console.log('RESULT BY DAILY', JSON.stringify(res.body))
          console.log('TODO: Make fake data with relative to current date, to be consistent and be able to check values without breaking test after one month')
        })
    });
  });
});
