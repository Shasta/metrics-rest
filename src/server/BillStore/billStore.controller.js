var _ = require('lodash');
var APIError = require('../../server/helpers/APIError');
// Model
var BillStore = require('./billStore.model');

const getBill = async (req, res, next) => {

    try {
        const hwId = req.query.hardware_id;
        const bill = await BillStore.find({ hardware_id: hwId, payed: false }).sort({ createdAt: -1 }).limit(1);
        return res.send(bill);

    } catch (rawError) {
        console.error(rawError);
        const dbError = new APIError('Error while saving to DB.')
        return next(dbError);
    }
}

const payBill = (ipfs_hash) => {
    try {
        await BillStore.update({ ipfs_hash: ipfs_hash },{$set: {payed: true}},{upsert: false});

    } catch (rawError) {
        console.error(rawError);
    }
}

module.exports = {
    getBill,
    payBill
}