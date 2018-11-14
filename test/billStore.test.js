const mongoose = require('mongoose');
const request = require('supertest');
const httpStatus = require('http-status');
const chai = require('chai'); // eslint-disable-line import/newline-after-import
const expect = chai.expect;
const should = chai.should();
const app = require('../src/index');

chai.config.includeStack = true;

const hardwareId = "26cf3b69-46f9-472f-afc6-b5ac8460ca54";

after((done) => {
    // required because https://github.com/Automattic/mongoose/issues/1251#issuecomment-65793092
    mongoose.models = {};
    mongoose.modelSchemas = {};
    mongoose.connection.close();
    done();
});

describe('# GET /api/bills/getBill', () => {
    it('should receive a non payed bill', () =>
        request(app)
            .get('/api/bills/getBill')
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