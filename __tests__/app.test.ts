import request from "supertest";
import { app, bucket } from "../src/app";
import { join, basename } from "path";

test("bucket is defined", () => {
  expect(process.env.BUCKET).toBeDefined();
  expect(bucket).toBeDefined();
});

describe("resizing images", () => {
  test("POST request to /images resizes all images", async () => {
    const { status, body } = await request(app)
      .post("/resize")
      .field("sizes", [64, 128, 256])
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

      const imageSizes = files.map((file) =>
        Number.parseInt(basename(file.name).replace("w", ""))
      );

      expect(imageSizes.sort()).toEqual(body.sizes.sort());

      await bucket.deleteFiles({
        delimiter: "/",
        prefix,
      });
    }
  });
});
