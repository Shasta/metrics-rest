import HardwareWhitelist from './hardwareWhitelist.model';

const whitelistHardware = async (req, res, next) => {
  const hwId = req.body.hardware_id;

  try {
    const hardware = new HardwareWhitelist({
      hardware_id: hwId,
      enabled: true
    });
    hardware.save();
  } catch (rawError) {
    console.error(rawError);
    const dbError = new APIError('Error while inserting into database.');
    throw dbError;
  }
}
const enableFakeMetrics = async (req, res, next) => {

}
const stopFakeMetrics = async (req, res, next) => {

}
const isWhitelisted = async (req, res, next) => {

}

export {
  whitelistHardware,
  enableFakeMetrics,
  stopFakeMetrics,
  isWhitelisted
};