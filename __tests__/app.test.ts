import request from "supertest";
import { app, bucket } from "../src/app";
import { join } from "path";

test("bucket is defined", () => {
  expect(process.env.BUCKET).toBeDefined();
  expect(bucket).toBeDefined();
});

describe("resizing images", () => {
  test("POST request to /images resizes all images", async () => {
    const { status, body } = await request(app)
      .post("/images")
      .attach("images", join(__dirname, "/assets/space.jpg"));

    expect(status).toBe(200);
    expect(body.sizes.length).toBeGreaterThan(0);

    for (const image of body.images) {
      const prefix = image.location;

      const [files] = await bucket.getFiles({
        autoPaginate: false,
        delimiter: "/",
        prefix,
      });

      expect(files.length).toBe(body.sizes.length);

      await bucket.deleteFiles({
        delimiter: "/",
        prefix,
      });
    }
  });
});
