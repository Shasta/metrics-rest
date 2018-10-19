import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import autopopulate from 'mongoose-autopopulate';
import { MetricProof } from 'metrics-mongoose';

import _ from 'lodash';

/* Statics methods of the model */
MetricProof.statics = {};

MetricProof.plugin(autopopulate);
MetricProof.plugin(mongoosePaginate);


/**
 * @typedef MetricProof
 * Export of the MetricProof model, containing the Case schema.
 */

export default mongoose.model('MetricProof', MetricProof);
