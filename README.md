# SthanaMitra

[Live Demo](https://sthanamitra.app) · https://sthanamitra.app

SthanaMitra is a student housing & property booking web app built with Node.js, Express and MongoDB. It provides a modern UI for browsing properties, listing new properties (owners), booking with Aadhaar verification, user profiles, wishlist, and reviews — inspired by booking apps like OYO and MakeMyTrip.

---

## 🔧 Features

- Browse & filter properties by city, price, room type, amenities and other criteria
- Property detail page with images, amenities and reviews
- Authenticated users can create bookings and cancel them (first month is free)
- Owners can list new properties with image uploads (multer & /public/uploads)
- Reviews system with pending/approved workflow
- Wishlist (add/remove from profile)
- Session backed by MongoDB (fallback to memory session when no DB)
- Database-first with memory fallback for local dev resilience
- Professional, responsive UI (custom CSS) with modern UX

---

## ⚙️ Tech stack

- Node.js (ES modules)
- Express.js
- EJS (view templates)
- MongoDB (using the native MongoDB driver)
- connect-mongo for session storage
- multer for file uploads
- bcryptjs for password hashing

---

## 🧩 Requirements

- Node.js 18+ (recommended)
- NPM
- MongoDB (local or remote)

---

## 📦 Install & Run (Local Development)

Clone the repository and install dependencies:

```bash
git clone https://github.com/djpie123/sthanamitra-src.git
cd sthanamitra-src
npm install
```

Create `server/mongo-config.json` (optional — if you want to use MongoDB session store and DB persistence):

```json
{
  "uri": "mongodb://localhost:27017",
  "dbName": "sthanamitra",
  "sessionSecret": "your-secret-here",
  "port": 5000
}
```

If you prefer not to use MongoDB while testing, the app will automatically fall back to an in-memory store. However, many features (persistence, listing, bookings) then behave temporarily.

Start the dev server:

```bash
npm run dev
```

Open in the browser (local dev):

```
http://localhost:5000
```

Live demo:

```
https://sthanamitra.app
```

---

## 🗂 Project layout

- `server/` — Express server and routes, DB integration
  - `server/app.js` — App bootstrap and session store config
  - `server/index.js` — Dev runner
  - `server/routes.js` — All route definitions (pages & API)
  - `server/auth.js` — DB access helpers + memory fallback
  - `server/storage.js` — Memory storage + DB wrapper
- `views/` — EJS templates
- `public/` — Static assets, `styles.css`, and `uploads/` for images
- `package.json` — Scripts & dependencies

---

## ✅ Routes & Endpoints (Overview)

- GET `/` — Home page (hero + popular properties)
- GET `/properties` — Browse & filter properties
- GET `/property/:id` — Property detail
- GET `/list` — Property listing form (owners) [authenticated]
- POST `/list` — Submit new property (multer uploads)
- GET `/booking/:propertyId` — Booking page [authenticated]
- POST `/booking` — Create a booking [authenticated]
- POST `/booking/cancel/:bookingId` — Cancel booking [authenticated]
- POST `/register` — Create account
- POST `/login` — Login
- POST `/logout` — Logout
- POST `/review` — Create review [authenticated]
- POST `/wishlist/add` — Add to wishlist [authenticated]
- POST `/wishlist/remove` — Remove from wishlist [authenticated]

API endpoints for data:
- GET `/api/properties`
- GET `/api/properties/:id`
- GET `/api/cities`
- GET `/api/reviews/:propertyId`

---

## 🗃 Database

- Recommended: MongoDB 5.x or newer (or Atlas free-tier)
- The app reads `server/mongo-config.json` for the MongoDB connection and session config. If file is not present or Mongo fails to connect, the app gracefully falls back to memory storage.
- Collections used:
  - `users`, `sessions`, `bookings`, `properties`, `cities`, `reviews`
- Indexes: `users.email` unique, `properties.id`, `cities.id`

---

## 🔐 Environment & Security

This project reads `server/mongo-config.json` for MongoDB `uri`, `dbName`, `sessionSecret` and optional `port`. Example file content is shown above. For production, make sure to:
- Use a strong `sessionSecret`
- Use secure connection (TLS/SSL) to MongoDB if remote
- Set `cookie.secure = true` and run behind HTTPS in production

---

## 📸 Uploads

- Uploaded files are stored at `public/uploads` via `multer`. Maximum 6 images per property, 5MB per file.
- If the `uploads/` folder doesn't exist, the app will attempt to create it on startup.

---

## 🧪 Testing & Development

- Use the seeded in-memory data to test locally (properties, cities, reviews are preloaded in `server/storage.js`)
- When MongoDB is configured, reads/writes are performed against the DB

---

## 🤝 Contributing

Contributions are welcome! Suggested workflow:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-change`
3. Commit your changes with clear messages
4. Open a pull request describing your changes

Be mindful when modifying `server/auth.js` or `server/storage.js` — they are responsible for the DB-first / memory fallback logic.

---

## 🧾 License

This project is licensed under the MIT License — see `LICENSE` for details.

---

## 💡 Tips

- For production runs, set `cookie: { secure: true }` and serve over HTTPS.
- For large image storage or scale, consider moving uploads to a cloud storage (S3/Cloudinary).
- Add an admin panel for review moderation and property verification for production.

---

If you want, I can also:
- Add env-specific examples (e.g., `.env` file) and a `.env.example` to make setup easier
- Create a small `docker-compose.yml` for local MongoDB + app
- Add instructions for deploying to Vercel/Heroku with a managed MongoDB

