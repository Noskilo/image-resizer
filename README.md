# Cloud Storage Image Resizer
This is an image resizer designed to be deployed as a micro-service on Google Cloud Platform. It listens for POST requests and resizes an array of images storing them in cloud storage.

# Usage
Ready to be deployed to Google App Engine. You can deploy from the terminal using [gcloud](https://cloud.google.com/sdk/docs/quickstarts).
```bash
cd ROOT_DIRECTORY
npm install
npm run prepare
```

## Production
Create `.env` in root directory and define your Google Cloud Storage bucket:
```
BUCKET=<BUCKET>
```
Deploy to Google App Engine by running:
```bash
gcloud app deploy
```
Make a `multipart/form-data` POST request to `
https://SERVICE_ID-dot-PROJECT_ID.REGION_ID.appspot.com/images
`.

## Local Development
Make sure you have a `.env` file in the root folder:
```
BUCKET=<BUCKET>
GOOGLE_APPLICATION_CREDENTIALS=<PATH_TO_ADMINSDK_CREDENTIALS>
```

You can start a development server to send POST requests to `http://localhost:5000/resize`.
```bash
npm run dev
```
