const { default: axios } = require("axios");
const axions = require("axios");

const launchesDatabase = require("./launches.mongo");
const planets = require("./planets.mongo");

const DEFAULT_FLIGHT_NUMBER = 100;

const SPACEX_API_URL = "https://api.spacexdata.com/v4/launches/query";

async function populateLaunches() {
  console.log("Downloading launch data....");
  const response = await axios.post(SPACEX_API_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });

  if (response.status !== 200) {
    console.log("Problem downloading launch data");
    throw new Error("Launch data download failed");
  }
  // data is where axios puts the body of the response from the server
  const launchDocs = response.data.docs;
  for (const launchDoc of launchDocs) {
    const payloads = launchDoc["payloads"];
    // javascript flatMap() method returns a new array formed by applying a given
    // callback function to each element of the array, and then flattening the
    // result by one level. It is identical to a map() followed by a flat()
    // of depth 1, but slightly more efficient than calling those two methods separately.
    const customers = payloads.flatMap((payload) => {
      return payload["customers"];
    });

    const launch = {
      flightNumber: launchDoc["flight_number"],
      mission: launchDoc["name"],
      rocket: launchDoc["rocket"]["name"],
      launchDate: launchDoc["date_local"],
      upcoming: launchDoc["upcoming"],
      success: launchDoc["success"],
      customers: customers,
    };

    console.log(`${launch.flightNumber} ${launch.mission} ${launch.customers}`);

    await saveLaunch(launch);
  }
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });

  console.log(firstLaunch);

  if (firstLaunch) {
    console.log("Launch data already loaded");
  } else {
    await populateLaunches();
  }
}

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(launchId) {
  return await findLaunch({
    flightNumber: launchId,
  });
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDatabase.findOne().sort("-flightNumber"); // retrieve one document from the database but sort it in descending order by adding '-' before the property name.

  if (!latestLaunch) {
    return DEFAULT_FLIGHT_NUMBER;
  }
  return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
  return await launchesDatabase
    .find(
      {}, // a filter with an empty object means that we want to find all the documents inside our database
      {
        _id: 0, // exclude id
        __v: 0, // exclude version key
      }
    )
    .sort({ flightNumber: 1 }) // sort using flight number (-1 descending, 1 ascending)
    .skip(skip)
    .limit(limit); // skip skips over the first n documents.mongoose and mongodb allows you to chain a .limit function into your 'find' which limits the amount of documents
  // that come back from mongo.
}

// this function is called on the scheduleNewLaunch function
async function saveLaunch(launch) {
  // if document already exists, update. if it doesnt exist, insert.
  // NOTE: updateOne() mutates our stored data including the request body in memory when using 'upsert: true'
  //       "$setOnInsert": {"__v": 0}
  // -----> findOneAndUpdate does not mutate our data.
  await launchesDatabase.findOneAndUpdate(
    {
      flightNumber: launch.flightNumber, // what we want to check if its exists.
    },
    launch, // what we want to insert if it does not exist or what we want to update with the data if it exists.
    {
      upsert: true, // allows us to insert or update if data we are checking exists.
    }
  );
}

// this function is for adding a new launch to our database
async function scheduleNewLaunch(launch) {
  // access first the planets database to find if the planet destination
  // exists. if it does not exist, do not save the launch.
  const planet = await planets.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error("No matching planet found");
  }
  const newFlightNumber = (await getLatestFlightNumber()) + 1;

  const newLaunch = Object.assign(launch, {
    success: true,
    upcoming: true,
    customers: ["NASA", "PPHI"],
    flightNumber: newFlightNumber,
  });

  await saveLaunch(newLaunch);
}

async function abortLaunchById(launchId) {
  // do not use upsert:true to prevent insertion of documents when the launchId does not exist
  const aborted = await launchesDatabase.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );

  return aborted.acknowledged === true && aborted.modifiedCount === 1;
}

module.exports = {
  loadLaunchData,
  existsLaunchWithId,
  getAllLaunches,
  scheduleNewLaunch,
  abortLaunchById,
};
