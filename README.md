# Shared storage service

Independent Docker deployment: [package setup and environment configuration](DEPLOYMENT.md).

Shared file service for platform applications. The Angular frontend lives in `../frontend`; maintenance records and business rules live in `../mmms-backend`. MMMS follows [MMMS-NEW.MD](../reqs/MMMS-NEW.MD).

Install with `npm install`, run with `npm start`, or use `npm run dev` for watch mode. `server.js` reads `.env.<NODE_ENV>` with development as the default. Set `PORT` to the endpoint expected by frontend storage configuration.

The existing API prefix is `/api/ss`. Image uploads use the images multipart field; video uploads use the video field. A pjname identifies the owning application. Uploaded files are stored beneath uploads. Review routes/UploadRouter.js and the shared authentication middleware before extending the upload contract.

MMMS attachments use authenticated, scoped upload/download routes. Private MMMS files are blocked from legacy public aliases. The independent profile sets `STORAGE_MMMS_ONLY=true`; preserve its upload volume and shared IAM authentication. See [DEPLOYMENT.md](DEPLOYMENT.md) for startup and production licensing settings.
