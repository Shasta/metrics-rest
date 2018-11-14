const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const autopopulate = require('mongoose-autopopulate');
const { BillStore } = require('metrics-mongoose');

/* Statics methods of the model */
BillStore.statics = {};

BillStore.plugin(autopopulate);
BillStore.plugin(mongoosePaginate);


/**
 * @typedef BillStore
 * Export of the GlobalProofBatch model, containing the Case schema.
 */

module.exports = mongoose.model('BillStore', BillStore);