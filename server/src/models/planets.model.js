const { parse } = require("csv-parse");
const fs = require("fs");
const path = require("path");

const planets = require("./planets.mongo");

// checks if planet is habitable by checking if the 'koi_disposition' is CONFIRMED
function isHabitablePlanet(planet) {
  return (
    planet["koi_disposition"] === "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.11 &&
    planet["koi_prad"] < 1.6
  );
}

/*
const promise = new Promise((resolve, reject) => {
  resolve(42);
});
promise.then((result) => {

})

const result = await promise;
console.log(result);
*/

function loadPlanetsData() {
  return new Promise((resolve, reject) => {
    // source: csv file
    // destination: writable stream as a result of calling the parse() function
    fs.createReadStream(
      path.join(
        __dirname,
        "../../",
        "data",
        "cumulative_2022.07.17_07.34.46.csv"
      )
    )
      .pipe(
        parse({
          comment: "#", // treats rows starting with '#' as comments
          columns: true, // return each row in our csv file as a javascript object with key:value pairs rather than just the values in our row
        })
      ) // pipe function connects a readable stream source to a writable stream destination (a stream that takes in data)
      // WITHOUT the pipe() method, this are just raw buffers of bytes. we want it to be
      .on("data", async (data) => {
        if (isHabitablePlanet(data)) {
          await savePlanet(data);
        }
      })
      .on("error", (err) => {
        console.log(err);
        reject(err);
      })
      .on("end", async () => {
        const countPlanetsFound = await getAllPlanets();
        console.log(`${countPlanetsFound.length} habitable planets found!`);
        resolve();
      });
  });
}

async function getAllPlanets() {
  // first arg: find a document based on criteria
  // second arg: exclude the selected properties
  return await planets.find(
    {}, // an empty object means to get all documents from the database
    {
      _id: 0, // exclude id
      __v: 0, // exclude version key
    }
  );
}

async function savePlanet(planet) {
  // habitablePlanets.push(data); parsed as a row of comma-separated value file

  try {
    // insert + update = upsert -> inserts data into a collection if it does not already exists in that collection. If it does exists, then it updates that document with whatever you pass into the upsert operation.
    // updateOne first arg: data we want to check if it exists, second arg: data we want to use to update the existing data, third arg: upsert: true -> upsert will update the document if it exists in the collection. if it does not exist, then it will
    await planets.updateOne(
      {
        keplerName: planet.kepler_name, // first arg: data we want to check if it exists (key-value pair)
      },
      { keplerName: planet.kepler_name }, // if it exists, we just update it with whatever we past here in this second arg
      { upsert: true }
    ); // save the planets data to our database instead
  } catch (err) {
    console.error(`Could not save planet ${err}`);
  }
}

module.exports = {
  loadPlanetsData,
  getAllPlanets,
};
