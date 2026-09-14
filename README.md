# Threadbase Cloudinary Upload — Starter

Current `POST /api/upload` uses multer `diskStorage` and returns local `/uploads/...` URL. Replace storage with Cloudinary while preserving field name `avatar`, JPG/PNG validation, 5 MB limit, and `{ url }` response.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Test with Thunder Client/Postman using `multipart/form-data`, field `avatar`, type File.

## Main files

- `config/upload.js` — current multer disk configuration
- `server.js` — upload route and error handler
- `.env.example` — required configuration names

Follow assignment brief in `../../assignment.md`.
