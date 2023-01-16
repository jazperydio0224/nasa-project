const request = require("supertest");
const app = require("../../app");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");
const { loadPlanetsData } = require("../../models/planets.model");

describe("Launches API", () => {
  // jest feature that ensures whatever is inside this code block will run first before other code executions
  beforeAll(async () => {
    await mongoDisconnect();
    await mongoConnect();
    await loadPlanetsData();
  });

  // jest feature that ensures whatever is inside this code block will run after other code executions
  // afterAll(async () => {
  //   await mongoDisconnect();
  // });

  describe("Test GET /v1/launches", () => {
    test("It should respond with 200 success", async () => {
      // supertest module will need the app.js file
      const response = await request(app)
        .get("/v1/launches")
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });

  describe("Test POST /v1/launches", () => {
    const completeLaunchData = {
      mission: "USS Enterprise",
      rocket: "NCC 1701-D",
      target: "Kepler-62 f",
      launchDate: "February 24, 2030",
    };

    const launchDataWithoutDate = {
      mission: "USS Enterprise",
      rocket: "NCC 1701-D",
      target: "Kepler-62 f",
    };

    test("It should respond with 201 created", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(completeLaunchData)
        .expect("Content-Type", /json/)
        .expect(201);

      const requestDate = new Date(completeLaunchData.launchDate).valueOf(); // valueOf() gets the numerical representation of a date
      const responseDate = new Date(response.body.launchDate).valueOf(); // valueOf() gets the numerical representation of a date
      expect(responseDate).toBe(requestDate);

      expect(response.body).toMatchObject(launchDataWithoutDate);
    });

    test("It should catch missing required properties", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(launchDataWithoutDate) // we send our data missing our launch date and we expect to get back a 400 response
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Missing required launch property",
      });
    });

    test("It should catch invalid dates", async () => {
      const response = await request(app)
        .post("/v1/launches")
        .send(
          Object.assign(completeLaunchData, {
            launchDate: "Invalid",
          })
        )
        .expect("Content-Type", /json/)
        .expect(400);

      expect(response.body).toStrictEqual({
        error: "Invalid launch date",
      });
    });
  });
});
