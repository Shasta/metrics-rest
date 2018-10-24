const mongoose = require('mongoose');
const request = require('supertest');
const httpStatus = require('http-status');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const expect = chai.expect;
const app = require('../src/index');

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
  setTimeout(function () {
    done();
  }, 500);
});

describe('## Metric Proof APIs', () => {
  const hw_metrics = {
    hardware_id: "1234",
    ipfs_hash: "QmRHa2xtveGem4xqPDVnN2mZRxaBqurCc6Z8nmjvNpo5ZG",
    metrics: {
      timestamp: 1540195373,
      watts_consumed: 1000,
      watts_produced: 230
    }
  };

  const invalid_hash_metrics = {
    hardware_id: "1234",
    ipfs_hash: "invalid_hash",
    metrics: {
      timestamp: 1540195373,
      watts_consumed: 1000,
      watts_produced: 230
    }
  };
  const hardwareId = '_e7bv9pm5byo';

  describe.skip('# POST /api/metrics/save-proof', () => {
    it('should receive a valid metrics and save it to mongodb', () =>
      request(app)
        .post('/api/metrics/save-proof')
        .send(hw_metrics)
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.body.status).to.equal("ok");
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

  describe('# GET /api/metrics/getConsumption', () => {
    it('should receive an array with the historic consumption', () =>
      request(app)
        .get('/api/metrics/getConsumption')
        .query({ hardware_id: hardwareId })
        .expect(httpStatus.OK)
        .then((res) => {
          expect(res.length > 0);
        })
    );
  });

  describe('# GET /api/metrics/getConsumption', () => {
    it('should receive an array with the historic consumption', () =>
      request(app)
        .get('/api/metrics/getCurrentMetrics')
        .query({ hardware_id: hardwareId })
        .expect(httpStatus.OK)
        .then((res) => {
         // console.log(res);
        })
    );
  });
});
