import dotenv from "dotenv";
import express from "express";
import { tmpdir } from "os";
import multer from "multer";
import { join, parse } from "path";
import { Storage } from "@google-cloud/storage";
import sharp from "sharp";
import fs from "fs-extra";
import { v4 as uuidv4 } from "uuid";

if (process.env.NODE_ENV !== "production") dotenv.config();

const gcs = new Storage();
const bucket = gcs.bucket(process.env.BUCKET);

const workingDir = join(tmpdir(), "images");
const app = express();
const port = process.env.PORT ?? 3000;

const upload = multer({ dest: workingDir });

// Resizes an array of image files from a multipart/form POST request
// Uploads resized images to GCP storage
// Responds with sizes and image data
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

      const fileId = uuidv4();
      const resizedLocation = `images/${fileId}/`;
      images.push({
        id: fileId,
        mimeType: file.mimetype,
        name: parse(file.originalname).name,
        location: resizedLocation,
      });


      const resizeDir = join(workingDir, "resize", fileId);
      fs.ensureDirSync(resizeDir);


      return sizes.map(async (size) => {
        const resizedName = `${size}w`;
        const resizedPath = join(resizeDir, resizedName);


        await sharp(file.path)
          .resize({
            width: size,
          })
          .toFile(resizedPath);


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
      return prev.concat(curr);
    });


  await Promise.all(uploadImages);

  res.send({
    sizes,
    images,
  });
});

app.listen(port, () =>
  console.log(`Image Resizer listening at http://localhost:${port}`)
);
