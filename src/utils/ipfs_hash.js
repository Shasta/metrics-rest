const Unixfs = require('ipfs-unixfs');
const {DAGNode} = require('ipld-dag-pb');

function ipfsHashFromString(string) {
  return new Promise(function(resolve, reject) {
    const data = Buffer.from(string, 'ascii');
    const unixFs = new Unixfs('file', data)

    DAGNode.create(unixFs.marshal(), (err, dagNode) => {
      if (err) {
        return reject(err);
      }
      return resolve(dagNode.toJSON().multihash);
    });
  });
}

module.exports = ipfsHashFromString;