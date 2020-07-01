import { Storage } from "@google-cloud/storage";
import express from "express";
import fs from "fs-extra";
import multer from "multer";
import { tmpdir } from "os";
import { join, parse } from "path";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";
import execa from "execa";
import gifsicle from "gifsicle";

console.log("Bucket: ", process.env.BUCKET);
const gcs = new Storage();
const bucket = gcs.bucket(process.env.BUCKET);

const workingDir = join(tmpdir(), "images");
const app = express();

const upload = multer({ dest: workingDir });

// Resizes an array of image files from a multipart/form POST request
// Uploads resized images to GCP storage
// Responds with sizes and image data
app.post("/resize", upload.array("images", 12), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.send({
      sizes: [],
      images: [],
    });
    return;
  }

  const sizes = req.body.sizes
    ? req.body.sizes.map((size) => Number.parseInt(size))
    : [64, 128, 256, 512];
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

        if (file.mimetype.includes("gif")) {
          await resizeGif(file, size, resizedPath);
        } else {
          await sharp(file.path)
            .resize({
              width: size,
            })
            .toFile(resizedPath);
        }

        return bucket
          .upload(resizedPath, {
            destination: resizedLocation + resizedName,
            gzip: true,
            contentType: file.mimetype,
            metadata: {
              metadata: {
                firebaseStorageDownloadTokens: fileId,
              },
            },
          })
          .catch((e) => {
            console.error(e);
            return {};
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

app.use((req, res, next) => {
  res.status(404).send({
    message: "Could not find what you're looking for.",
    routes: {
      post: ["/resize"],
    },
  });
});

async function resizeGif(
  file: Express.Multer.File,
  size: number,
  resizedPath: string
) {
  await execa(gifsicle, [
    "-o",
    resizedPath,
    file.path,
    `--resize-fit-width=${size}`,
  ]);
}

export { app, bucket };
