const request = require("supertest");
const app = require("../../app");
const { mongoConnect, mongoDisconnect } = require("../../services/mongo");

describe("Planets API", () => {
  // jest feature that ensures whatever is inside this code block will run first before other code executions
  beforeAll(async () => {
    await mongoDisconnect();
    await mongoConnect();
  });

  // jest feature that ensures whatever is inside this code block will run after other code executions
  // afterAll(async () => {
  //   await mongoDisconnect();
  // });

  describe("Test GET /v1/planets", () => {
    test("It should respond with 200 success", async () => {
      // supertest module will need the app.js file
      const response = await request(app)
        .get("/v1/planets")
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });
});
