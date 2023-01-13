const { getAllPlanets } = require("../../models/planets.model");

async function httpGetAllPlanets(req, res) {
  return res.status(200).json(await getAllPlanets()); // make sure that only one response is sent
}

module.exports = {
  httpGetAllPlanets,
};
