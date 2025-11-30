# SthanaMitra

SthanaMitra is a small property listing app using Node.js, Express, EJS, and MongoDB.

## Image processing & deployment notes

This project supports server-side image processing when users upload images for properties. Because some image libraries require native binaries (which can fail to build on serverless platforms like Vercel), the server selects an image processor dynamically in this order:

1. `sharp` — preferred: fast, widely supported, and prebuilt binaries are available on Vercel.
2. `jimp` — JS fallback (slower) that works without native dependencies and resizes to JPEG.
3. Base64 fallback — if none of the above is available, images are stored as data URIs (no resizing).

Recommended deployment steps for Vercel

- Use Node 18 or later (recommended: 18 or 20). Set the Node version in your Vercel project settings or in your `package.json` via the `engines` field.

- Install `sharp` as a dependency when building on Vercel:

  ```bash
  npm install sharp
  ```

  Vercel will use the prebuilt `libvips` binary for `sharp`, so it generally works on Vercel serverless functions without additional configuration.

We have removed `canvas` from dependencies because it requires native system libraries and often fails to install in serverless build environments like Vercel. `sharp` is the preferred choice; `jimp` remains available as a pure-JS fallback.

Alternatives

- If you prefer not to install native modules, remove `sharp` from dependencies and rely on `jimp`, or use an external image service.
- Using a managed CDN+image service like Cloudinary/Imgix/Cloudflare Images is the most robust option:
  - Upload images to Cloudinary and save image URLs in the database.
  - Use Cloudinary's transformation URL flags to serve resized/webp images on the fly.

Local development

- To develop locally and have server-side image resizing, install the recommended dependency:
  ```bash
  npm install
  npm install sharp
  ```
  If you want more advanced local image tooling, `sharp` is the recommended option. If you must use `node-canvas` locally for advanced drawing, follow platform-specific installation instructions and note that `canvas` is not used by default in this repository.

Troubleshooting

If you see native binary installation errors during deploy to Vercel, prefer `sharp` or fallback to `jimp`, or use an external CDN/processing service like Cloudinary.
- If `sharp` fails to install on Vercel, ensure the Node version and Vercel runtime are recent. If you still can't get `sharp`, consider using `jimp` or moving to an external CDN for image processing.


## Quick Run (local)

- Install dependencies:

  ```bash
  npm install
  npm install sharp
  ```

- Start the app:

  ```bash
  npm run dev
  ```

### Check which image libs are available

During local development or on CI, you can check which image processing libraries are present:

```bash
npm run check-image-libs
```

## Contact & Notes

If you deploy on Vercel and need help with `sharp` installation issues, I can add a ready-made Cloudinary integration with signed uploads and transformation URLs to make the deployment robust and CDN-optimized.
