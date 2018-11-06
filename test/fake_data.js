const _ = require('lodash');
const ipfsHashFromString = require('../src/utils/ipfs_hash');

const dailyMetricsBatch = id => _([{
  "hardware_id": id,
  "ipfs_hash": "",
  "metrics": {
    "hardware_id": id,
    "timestamp": 1540391779,
    "watts_consumed": 1000,
    "watts_produced": 1200,
  }
},
{
  "hardware_id": id,
  "ipfs_hash": "",
  "metrics": {
    "hardware_id": id,
    "timestamp": 1540393200,
    "watts_consumed": 2000,
    "watts_produced": 2200
  }
},
{
  "hardware_id": id,
  "ipfs_hash": "",
  "metrics": {
    "hardware_id": id,
    "timestamp": 1540429200,
    "watts_consumed": 5000,
    "watts_produced": 3400
  }
},
{
  "hardware_id": id,
  "ipfs_hash": "",
  "metrics": {
    "hardware_id": id,
    "timestamp": 1540512060,
    "watts_consumed": 9000,
    "watts_produced": 10200
  }
},
{
  "hardware_id": id,
  "ipfs_hash": "",
  "metrics": {
    "hardware_id": id,
    "timestamp": 1540634400,
    "watts_consumed": 11000,
    "watts_produced": 12000
  }
}])
.map(async x => {
  x.ipfs_hash = await ipfsHashFromString(JSON.stringify(x.metrics))
  return x;
})
.value()

export {
  dailyMetricsBatch
}