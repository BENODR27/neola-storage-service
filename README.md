# Shared storage service

Independent Docker deployment: [package setup and environment configuration](DEPLOYMENT.md).

Shared file service for platform applications. The Angular frontend lives in `../frontend`; maintenance records and business rules live in `../mmms-backend`. MMMS follows [MMMS-NEW.MD](../reqs/MMMS-NEW.MD).

Install with `npm install`, run with `npm start`, or use `npm run dev` for watch mode. `server.js` reads `.env.<NODE_ENV>` with development as the default. Set `PORT` to the endpoint expected by frontend storage configuration.

The existing API prefix is `/api/ss`. Image uploads use the images multipart field; video uploads use the video field. A pjname identifies the owning application. Uploaded files are stored beneath uploads. Review routes/UploadRouter.js and the shared authentication middleware before extending the upload contract.

Storage hardening and full MMMS document/photo/video attachment journeys still need acceptance work. Do not treat the current public static-file route as suitable for confidential maintenance documents. See [architecture](../docs/ARCHITECTURE.md) and [coverage](../docs/MMMS-REQUIREMENTS-COVERAGE.md).
# neola-storage-service
