import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
import autopopulate from 'mongoose-autopopulate';
import { HardwareWhitelist } from 'metrics-mongoose';

/* Statics methods of the model */
HardwareWhitelist.statics = {};

HardwareWhitelist.plugin(autopopulate);
HardwareWhitelist.plugin(mongoosePaginate);


/**
 * @typedef HardwareWhitelist
 * Export of the HardwareWhitelist model, containing the Case schema.
 */

export default mongoose.model('HardwareWhitelist', HardwareWhitelist);
