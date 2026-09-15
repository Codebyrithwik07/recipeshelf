# RecipeShelf Cloudinary Challenge

RecipeShelf is a small Express API for recipes and cover images. Recipe data is kept in memory so focus stays on upload architecture.

Current upload works locally. It is not production-safe. You are expected to investigate and repair it, not replace one marked TODO.

## Product contract

- List recipes: `GET /api/recipes`
- Read recipe: `GET /api/recipes/:recipeId`
- Upload cover: `POST /api/recipes/:recipeId/cover`
- Multipart file field: `cover`
- Success status: `201`
- Success body:

```json
{
  "recipeId": "r1",
  "coverUrl": "https://res.cloudinary.com/..."
}
```

A recipe stores both `coverUrl` for display and `coverPublicId` for later media management.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5000/health`, then `http://localhost:5000/api/recipes`.

Use Thunder Client or Postman for multipart requests.

## Production report

QA found these symptoms:

1. Cover URLs stop working after application server is replaced.
2. GIF and SVG files pass current validation, although product accepts only JPG and PNG.
3. Current size limit is larger than product limit of 4 MB.
4. Client sends field `cover`, but current upload route expects something else.
5. Existing cover state does not include Cloudinary management ID.
6. Upstream media failures look like generic internal server failures.
7. Replacement logic must not delete working old cover before new state is safe.

Not every fix belongs in same file. Trace route from middleware to response.

## Required result

Implement production upload using Cloudinary:

- server-only credentials from environment;
- multer `memoryStorage`;
- exact MIME allowlist for `image/jpeg` and `image/png`;
- 4 MB limit;
- Buffer upload through `cloudinary.uploader.upload_stream`;
- folder `recipeshelf/covers`;
- `resource_type: "image"`;
- recipe update with `secure_url` and `public_id`;
- safe old-cover deletion after successful new state;
- `400`, `413`, `404`, and `502` responses where appropriate.

## Suggested investigation order

1. Run existing API and inspect recipe shape.
2. Compare product contract above with `upload.single(...)`.
3. Inspect multer storage, filter, and limit.
4. Mark every line that assumes a local filename.
5. Decide what data Cloudinary helper must return.
6. Decide when recipe lookup should happen.
7. Decide when an old `public_id` is safe to delete.
8. Implement, then test failures before happy path only.

## Small hints

<details>
<summary>Where should bytes come from?</summary>

With `memoryStorage`, multer exposes accepted bytes at `req.file.buffer`. A local path and filename are no longer useful.
</details>

<details>
<summary>How can upload_stream work with await?</summary>

Wrap callback API in a Promise. Resolve with result, reject with error, and end returned stream with Buffer.
</details>

<details>
<summary>What is safe replacement order?</summary>

Remember existing `coverPublicId`. Upload new cover, update recipe with new values, then request deletion of old asset. Never delete old asset first.
</details>

<details>
<summary>How should unknown recipe behave?</summary>

Reject it before sending bytes to Cloudinary. There is no reason to create cloud asset for recipe that does not exist.
</details>

## Test matrix

| Case | Expected |
|---|---|
| Existing recipe + JPG under 4 MB | `201`, HTTPS `coverUrl` |
| Existing recipe + PNG under 4 MB | `201`, HTTPS `coverUrl` |
| Field named `image` | `400` |
| GIF, SVG, PDF, or MP4 | `400` |
| File above 4 MB | `413` |
| Missing file | `400` |
| Unknown recipe | `404`, no cloud upload |
| Invalid Cloudinary credentials | `502`, safe message |
| Replace existing cover | New values saved, old asset deleted afterward |

After successful upload, stop local server and open `coverUrl`. It should still work.

## Security

- Never commit `.env`.
- Never paste API secret into issue, PR, screenshot, or frontend.
- If secret is exposed, rotate it in Cloudinary immediately.
- Check `git diff` and `git status` before pushing.

## Submission evidence

PR description should show valid response, saved recipe response, persistence test, one rejected request, and short replacement-order explanation.
