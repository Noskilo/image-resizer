import dotenv from "dotenv";
import express from "express";
import { tmpdir } from "os";
import multer from "multer";
import { join, parse } from "path";
import { Storage } from "@google-cloud/storage";
import sharp from "sharp";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const gcs = new Storage();
const bucket = gcs.bucket(process.env.BUCKET);

const workingDir = join(tmpdir(), "images");
const app = express();
const port = process.env.PORT ?? 3000;

const upload = multer({ dest: workingDir });

app.post("/images", upload.array("images", 12), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.send({
      sizes: [],
      images: [],
    });
    return;
  }

  const sizes = [64, 128, 256, 512];
  const images: {
    id: string;
    mimeType: string;
    name: string;
    location: string;
  }[] = [];

  const uploadImages = (req.files as Express.Multer.File[])
    .map((file) => {
      // Generate a unique ID for each image
      const fileId = uuidv4();
      const resizedLocation = `images/${fileId}/`;
      images.push({
        id: fileId,
        mimeType: file.mimetype,
        name: parse(file.originalname).name,
        location: resizedLocation,
      });

      // Create directory to dump resized images
      const resizeDir = join(workingDir, "resize", fileId);
      fs.ensureDirSync(resizeDir);

      // Return array of bucket upload promises
      return sizes.map(async (size) => {
        const resizedName = `${size}w`;
        const resizedPath = join(resizeDir, resizedName);

        // Resize images to temporary file
        await sharp(file.path)
          .resize({
            width: size,
          })
          .toFile(resizedPath);

        // Map to bucket upload promise
        return bucket.upload(resizedPath, {
          destination: resizedLocation + resizedName,
          gzip: true,
          contentType: file.mimetype,
          metadata: {
            metadata: {
              firebaseStorageDownloadTokens: fileId,
            },
          },
        });
      });
    })
    .reduce((prev, curr) => {
      // Flatten array
      return prev.concat(curr);
    });

  // Upload images to bucket
  await Promise.all(uploadImages);
  // await fs.remove(workingDir);
  res.send({
    sizes,
    images,
  });
});

app.listen(port, () =>
  console.log(`Example app listening at http://localhost:${port}`)
);
