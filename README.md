# Cloud Storage Image Resizer
This is an image resizer designed to be deployed as a microservice on Google Cloud Platform. It listens for POST requests and resizes an array of images storing them in cloud storage.

# Usage
Ready to be deployed to Google App Engine. You can deploy from the terminal using [gcloud](https://cloud.google.com/sdk/docs/quickstarts).
```bash
cd ROOT_DIRECTORY
npm install
npm run prepare
```
Create `env-variables.yaml` in root directory and define your storage bucket:
```yaml
env_variables:
	BUCKET: PROJECT_ID.appspot.com
```
## Production
Make a `multipart/form-data` POST request to `
https://SERVICE_ID-dot-PROJECT_ID.REGION_ID.appspot.com/images
`.

## Local Development
You can start a development server to send POST requests to `http://localhost:5000/images`.
```bash
npm run dev
```
