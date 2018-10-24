import path from "path";
const mongoose = require("mongoose");
const fs = Promise.promisifyAll(require("fs"));

function clearCollections() {
  return Promise.map(Object.keys(mongoose.connection.collections), modelName => {
    mongoose.connection.collections[modelName].remove(function(err, ok) {
      if (err) {
        throw err;
      }
      return ok;
    });
  });
}

function afterTests(done) {
  mongoose.disconnect();
}

async function beforeCaseTests() {
  // Clear test mongodatabase
  // const rawCases = await getJsonExamples("../data-examples/raw-cases");
  await clearCollections();
}

function onlyJSONExtension(dir) {
  return file => {
    const filePath = `${dir}/${file}`;
    const fileExtension = path.extname(filePath);
    return fileExtension === ".json";
  };
}

async function getJsonExamples(dir) {
  try {
    const dirFiles = await fs.readdirAsync(path.join(__dirname, dir));
    const readJson = await Promise.all(
      dirFiles
        .filter(onlyJSONExtension(path.join(__dirname, dir)))
        .map(file =>
          fs.readFileAsync(`${path.join(__dirname, dir)}/${file}`, "utf8")
        )
    );
    const parsedJsons = readJson.map(jsonfile => JSON.parse(jsonfile));
    return parsedJsons;
  } catch (err) {
    console.log(err);
  }
}

export {
  afterTests,
  beforeCaseTests,
  onlyJSONExtension,
  getJsonExamples
};
