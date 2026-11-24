# Shared storage service instructions

Read ../AGENTS.md. This service supports attachments across platform apps. MMMS maintenance records belong in mmms-backend; frontend forms belong in frontend.

Keep upload contracts compatible with existing consumers. Require shared authentication and scoped access for sensitive attachments. Validate filenames, project identifiers, MIME types and size limits before storing files. Store file metadata/references in the owning app; do not create a second token store or duplicate domain data here.

npm start runs the service; npm run dev restarts it on edits. Document storage configuration without secrets. Changes to shared routes must preserve WMS and other app behavior. MMMS uses authenticated /api/ss/mmms/files. Its files must never be exposed through the legacy public uploads route. Run npm test for upload, download and scope regression checks; see ../docs/MMMS-TESTING.md.
