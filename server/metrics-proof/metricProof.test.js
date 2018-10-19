const mongoose = require('mongoose');
const request = require('supertest-as-promised');
const httpStatus = require('http-status');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const expect = chai.expect;
const app = require('../../index');

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

describe('## Metric Proof APIs', () => {
  const metrics_batch = [
    {
      hardware_id: "1234",
      ipfs_hash: "z132fasf",
      data: {
        watts_consumed: 1000,
        watts_produced: 230,
      }
    },
    {
      hardware_id: "1234",
      ipfs_hash: "z132fasf",
      data: {
        watts_consumed: 1000,
        watts_produced: 230,
      }
    }
  ];

  const invalid_metrics_batch = [
    {
      hardware_id: "1234",
      ipfs_hash: "z132fasf",
      data: {
        watts_consumed: 1000,
        watts_produced: 230,
      }
    },
    {
      hardware_id: "1234",
      ipfs_hash: "z132fasf",
      data: {
        watts_consumed: 1000,
        watts_produced: 230,
      }
    }
  ];

  describe('# POST /api/metric-proof/backup', () => {
    it('should receive a valid batch and save it to mongodb', (done) => {
      request(app)
        .post('/api/metric-proof/backup')
        .send(metrics_batch)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.status).to.equal(true);
          done();
        })
        .catch(done);
    });
  });
});
