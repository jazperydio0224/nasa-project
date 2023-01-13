const mongoose = require("mongoose");

require("dotenv").config();

const MONGO_URL = process.env.MONGO_URL;

// can be put anywhere in our file as long as we required mongoose
mongoose.connection.once("open", () => {
  console.log("MongoDB connection ready!");
});

// can be put anywhere in our file as long as we required mongoose
mongoose.connection.on("error", (err) => {
  console.error(err);
});

async function mongoConnect() {
  await mongoose.connect(MONGO_URL);
}

async function mongoDisconnect() {
  await mongoose.disconnect(MONGO_URL);
}
module.exports = {
  mongoConnect,
  mongoDisconnect,
};
