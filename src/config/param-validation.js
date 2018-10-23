const Joi = require('joi');

module.exports = {
  // POST /api/users
  createUser: {
    body: {
      username: Joi.string().required(),
      mobileNumber: Joi.string().regex(/^[1-9][0-9]{9}$/).required()
    }
  },

  // UPDATE /api/users/:userId
  updateUser: {
    body: {
      username: Joi.string().required(),
      mobileNumber: Joi.string().regex(/^[1-9][0-9]{9}$/).required()
    },
    params: {
      userId: Joi.string().hex().required()
    }
  },

  // POST /api/auth/login
  login: {
    body: {
      username: Joi.string().required(),
      password: Joi.string().required()
    }
  },
  singleMetric: {
    body: {
      hardware_id: Joi.string().required(),
      ipfs_hash: Joi.string().required(),
      metrics: Joi.object().keys({
        watts_consumed: Joi.number().required(),
        watts_produced: Joi.number().required(),
        timestamp: Joi.number().required()
      })
    }
  },
  hardware: {
    body: {
      hardware_id: Joi.string().required()
    }
  }
};
