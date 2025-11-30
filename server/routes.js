import { createServer } from "http";
import { storage } from "./storage.js";
import { createUser, verifyUser, findUserByEmail, updateUser, addToWishlist, removeFromWishlist, createBooking, getBookingsByUser, cancelBooking, createReview } from "./auth.js";
import { ensureAuthenticated } from "./middleware/auth.js";
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function registerRoutes(app) {
  app.get("/", async (req, res) => {
    try {
      const cities = await storage.getCities();
      const properties = await storage.getProperties();
      const popularProperties = properties.slice(0, 6);
      res.render("home", { cities, properties: popularProperties });
    } catch (error) {
      console.error("Error rendering home:", error);
      res.status(500).send("Error loading home page");
    }
  });

  app.get("/properties", async (req, res) => {
    try {
      const { city, minPrice, maxPrice, roomType, amenities, genderPreference, propertyType, sortBy, search } = req.query;

      let properties = await storage.getProperties();

      if (search && typeof search === "string") {
        const searchLower = search.toLowerCase();
        properties = properties.filter(
          (p) =>
            p.title.toLowerCase().includes(searchLower) ||
            p.area.toLowerCase().includes(searchLower) ||
            p.city.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower)
        );
      }

      if (city && typeof city === "string") {
        const decodedCity = decodeURIComponent(city);
        properties = properties.filter((p) => p.city.toLowerCase() === decodedCity.toLowerCase());
      }

      if (minPrice && typeof minPrice === "string") {
        const min = parseInt(minPrice);
        properties = properties.filter((p) => p.price >= min);
      }

      if (maxPrice && typeof maxPrice === "string") {
        const max = parseInt(maxPrice);
        properties = properties.filter((p) => p.price <= max);
      }

      if (roomType && typeof roomType === "string") {
        const types = roomType.split(",");
        properties = properties.filter((p) => types.includes(p.roomType));
      }

      if (propertyType && typeof propertyType === "string" && propertyType !== "all") {
        properties = properties.filter((p) => p.propertyType === propertyType);
      }

      if (genderPreference && typeof genderPreference === "string" && genderPreference !== "all") {
        properties = properties.filter(
          (p) => p.genderPreference === "any" || p.genderPreference === genderPreference
        );
      }

      if (amenities && typeof amenities === "string") {
        const requiredAmenities = amenities.split(",");
        properties = properties.filter((p) =>
          requiredAmenities.every((amenity) =>
            p.amenities.some((a) => a.toLowerCase() === amenity.toLowerCase())
          )
        );
      }

      if (sortBy === "price-low") {
        properties.sort((a, b) => a.price - b.price);
      } else if (sortBy === "price-high") {
        properties.sort((a, b) => b.price - a.price);
      } else if (sortBy === "rating") {
        properties.sort((a, b) => {
          const ratingA = a.rating ? parseFloat(a.rating) : 0;
          const ratingB = b.rating ? parseFloat(b.rating) : 0;
          return ratingB - ratingA;
        });
      }

      const cities = await storage.getCities();
      res.render("properties", { properties, cities, currentCity: city || "", currentSearch: search || "" });
    } catch (error) {
      console.error("Error rendering properties:", error);
      res.status(500).send("Error loading properties page");
    }
  });
  app.get("/about", async (req, res) => {
    res.render("about");
  })
    app.get("/contact", async (req, res) => {
    res.render("contact");
  })
  app.get("/property/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const property = await storage.getPropertyById(id);

      if (!property) {
        return res.status(404).send("Property not found");
      }

      const reviews = await storage.getReviewsByPropertyId(id);
      
      let user = null;
      if (req.session && req.session.userEmail) {
        try {
          user = await findUserByEmail(req.session.userEmail);
        } catch (err) {
          user = null;
        }
      }
      res.render("property-detail", { property, reviews, user });
    } catch (error) {
      console.error("Error rendering property detail:", error);
      res.status(500).send("Error loading property page");
    }
  });

 
  app.get('/list', ensureAuthenticated, async (req, res) => {
    try {
      const cities = await storage.getCities();
      res.render('list', { cities, error: null });
    } catch (err) {
      console.error('List page error', err);
      res.status(500).send('Failed to load list page');
    }
  });


  app.get('/register', async (req, res) => {
    res.render('register', { error: null });
  });

  app.post('/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).render('register', { error: 'Please provide all required fields.' });
      }
      const existing = await findUserByEmail(email);
      if (existing) {
        return res.status(400).render('register', { error: 'User with this email already exists.' });
      }
      const id = await createUser({ name, email, password });
      
      req.session.userId = id;
      req.session.userName = name;
      req.session.userEmail = email;
      req.session.userWishlist = [];
      req.session.successMessage = `Welcome, ${name}! Your account was successfully created.`;
      return res.redirect('/profile');
    } catch (err) {
      console.error('Register error:', err);
    
      if (err && err.code === 11000) {
        return res.status(400).render('register', { error: 'An account with this email already exists.' });
      }
      if (err && (err.name === 'MongoServerSelectionError' || (err.message && err.message.includes('ECONNREFUSED')))) {
        return res.status(503).render('register', { error: 'Registration is temporarily unavailable — database connection issue. Please try again later.' });
      }
      if (err && err.code === 11000) {
        return res.status(400).render('register', { error: 'An account with this email already exists.' });
      }
      return res.status(500).render('register', { error: 'Internal server error' });
    }
  });

  app.get('/login', async (req, res) => {
    res.render('login', { error: null });
  });

  app.get('/profile', ensureAuthenticated, async (req, res) => {
    try {
      const userEmail = req.session.userEmail;
      if (!userEmail) return res.redirect('/login');
      const user = await findUserByEmail(userEmail);
      if (user) {
        
        req.session.userWishlist = user.wishlist || [];
        req.session.save((err) => {
          if (err) console.error('Session save error:', err);
        });
      }
      const bookings = await getBookingsByUser(userEmail);
      res.render('profile', { user, bookings });
    } catch (err) {
      console.error('Profile error:', err);
      return res.status(500).send('Failed to load profile');
    }
  });

  app.get('/profile/edit', ensureAuthenticated, async (req, res) => {
    try {
      const userEmail = req.session.userEmail;
      const user = await findUserByEmail(userEmail);
      if (!user) return res.redirect('/login');
      res.render('profile-edit', { user, error: null });
    } catch (err) {
      console.error('Profile edit error:', err);
      return res.status(500).send('Failed to load profile edit');
    }
  });

  app.post('/profile/edit', ensureAuthenticated, async (req, res) => {
    try {
      const { name, password } = req.body;
      const email = req.session.userEmail;
      if (!email) return res.redirect('/login');
      const updates = {};
      if (typeof name === 'string' && name.trim().length) updates.name = name.trim();
      if (typeof password === 'string' && password.length >= 6) {
        
        const bcrypt = (await import('bcryptjs')).default;
        updates.password = bcrypt.hashSync(password, 10);
      }
      const updated = await updateUser(email, updates);
      if (updated && updated.name) req.session.userName = updated.name;
      req.session.successMessage = 'Profile updated successfully.';
      return res.redirect('/profile');
    } catch (err) {
      console.error('Profile update error:', err);
      return res.status(500).render('profile-edit', { user: null, error: 'Failed to update profile' });
    }
  });

  app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).render('login', { error: 'Please provide email and password.' });
      }
      const user = await verifyUser(email, password);
      if (!user) {
        return res.status(400).render('login', { error: 'Invalid email or password.' });
      }
      req.session.userId = user._id || user.id;
      req.session.userName = user.name;
      req.session.userEmail = user.email;
      req.session.userWishlist = user.wishlist || [];
      req.session.successMessage = `Welcome back, ${user.name}!`;
      return res.redirect('/profile');
    } catch (err) {
      console.error('Login error:', err);
      if (err && (err.name === 'MongoServerSelectionError' || (err.message && err.message.includes('ECONNREFUSED')))) {
        return res.status(503).render('login', { error: 'Login is temporarily unavailable — database connection issue. Please try again later.' });
      }
      return res.status(500).render('login', { error: 'Internal server error' });
    }
  });

  app.post('/logout', async (req, res) => {
    req.session.destroy(err => {
      if (err) console.error('Logout error', err);
      res.redirect('/');
    });
  });

 
 
  const memoryStorage = multer.memoryStorage();
  const upload = multer({ storage: memoryStorage, limits: { fileSize: 5 * 1024 * 1024 } });


  app.post('/list', ensureAuthenticated, upload.array('images', 6), async (req, res) => {
    try {
      const {
        title, description, propertyType, city, area, price, amenities, roomType, genderPreference, availableRooms, distanceFromCollege
      } = req.body;

      
      if (!title || !description || !city || !price) {
        return res.status(400).render('list', { cities: await storage.getCities(), error: 'Please provide title, description, city and price' });
      }

              const files = req.files || [];
          const images = [];
             
                  let sharpLib = null;
                  let jimpLib = null;
                  try {
                    sharpLib = await import('sharp');
                  } catch (err) {
                    console.warn('`sharp` package not available. Will try `jimp` as fallback.');
                    sharpLib = null;
                  }
                  if (!sharpLib) {
                    try {
                      const jimpModule = await import('jimp');
                      jimpLib = jimpModule.default || jimpModule;
                    } catch (err) {
                      console.warn('`jimp` package not available — falling back to base64 store (no resizing).');
                      jimpLib = null;
                    }
                  }
          for (const f of files) {
            try {
            
              if (sharpLib && typeof sharpLib.default === 'function') {
                const sharp = sharpLib.default;
                const sizesWanted = [480, 800, 1200];
                const formats = [];
                for (const targetW of sizesWanted) {
                  try {
                    const resizeW = Math.min(targetW, f.buffer ? (await sharp(f.buffer).metadata()).width : targetW);
                   
                    const webpBuf = await sharp(f.buffer).resize({ width: resizeW }).webp({ quality: 80 }).toBuffer();
                    formats.push({ width: resizeW, mime: 'image/webp', src: `data:image/webp;base64,${webpBuf.toString('base64')}` });
                    
                    const jpegBuf = await sharp(f.buffer).resize({ width: resizeW }).jpeg({ quality: 85 }).toBuffer();
                    formats.push({ width: resizeW, mime: 'image/jpeg', src: `data:image/jpeg;base64,${jpegBuf.toString('base64')}` });
                  } catch (errInner) { console.warn('sharp resize failed for target', targetW, errInner && errInner.message); }
                }
                let def = formats.find(fm => fm.mime === 'image/webp' && fm.width === 800) || formats.find(fm => fm.mime === 'image/jpeg' && fm.width === 800) || formats[0] || null;
                images.push({ filename: f.originalname, formats, default: def ? def.src : null });
              } else if (jimpLib) {
                const Jimp = jimpLib;
                const sizesWanted = [480, 800, 1200];
                const formats = [];
                try {
                  const img = await Jimp.read(f.buffer);
                  for (const targetW of sizesWanted) {
                    let tw = targetW;
                    if (img.bitmap.width < targetW) tw = img.bitmap.width;
                    const cloned = img.clone().resize(tw, Jimp.AUTO);
                    const jpegBuffer = await cloned.getBufferAsync(Jimp.MIME_JPEG);
                    formats.push({ width: tw, mime: 'image/jpeg', src: `data:image/jpeg;base64,${jpegBuffer.toString('base64')}` });
                  }
                } catch (errJimp) {
                  console.warn('jimp processing failed', errJimp && errJimp.message);
                }
                let def = formats.find(fm => fm.mime === 'image/jpeg' && fm.width === 800) || formats[0] || null;
                images.push({ filename: f.originalname, formats, default: def ? def.src : null });
              } else if (jimpLib) {
                const Jimp = jimpLib;
                const sizesWanted = [480, 800, 1200];
                const formats = [];
                try {
                  const img = await Jimp.read(f.buffer);
                  for (const targetW of sizesWanted) {
                    let tw = targetW;
                    if (img.bitmap.width < targetW) tw = img.bitmap.width;
                    const cloned = img.clone().resize(tw, Jimp.AUTO);
                    const jpegBuffer = await cloned.getBufferAsync(Jimp.MIME_JPEG);
                    formats.push({ width: tw, mime: 'image/jpeg', src: `data:image/jpeg;base64,${jpegBuffer.toString('base64')}` });
                  }
                } catch (errJimp) {
                  console.warn('jimp processing failed', errJimp && errJimp.message);
                }
                let def = formats.find(fm => fm.mime === 'image/jpeg' && fm.width === 800) || formats[0] || null;
                images.push({ filename: f.originalname, formats, default: def ? def.src : null });
              } else {
              
                const dataUri = `data:${f.mimetype};base64,${f.buffer.toString('base64')}`;
                images.push({ filename: f.originalname, formats: [{ width: null, mime: f.mimetype, src: dataUri }], default: dataUri });
              }
            } catch (err) {
              
              console.warn('Image processing failed, falling back to raw buffer:', err.message || err);
              try {
                const dataUri = `data:${f.mimetype};base64,${f.buffer.toString('base64')}`;
                images.push(dataUri);
              } catch (err2) {
                console.warn('Fallback base64 conversion failed', err2.message || err2);
              }
            }
          }

      const propertyData = {
        title: title.trim(),
        description: description.trim(),
        propertyType: propertyType || 'pg',
        city: city.trim(),
        area: area?.trim() || '',
        price: parseInt(price) || 0,
        images,
        amenities: amenities && typeof amenities === 'string' ? amenities.split(',').map(a => a.trim()).filter(a => a) : [],
        roomType: roomType || 'single',
        genderPreference: genderPreference || 'any',
        availableRooms: parseInt(availableRooms) || 1,
        distanceFromCollege: parseInt(distanceFromCollege) || 0,
        createdBy: req.session.userEmail,
        verified: false
      };

      const created = await storage.createProperty(propertyData);
      if (!created) {
        return res.status(500).render('list', { cities: await storage.getCities(), error: 'Failed to create property' });
      }

      req.session.successMessage = 'Property listed successfully! It may take a moment to appear.';
      return res.redirect(`/property/${created.id}`);
    } catch (err) {
      console.error('Create property error', err);
      return res.status(500).render('list', { cities: await storage.getCities(), error: 'Failed to create property' });
    }
  });


  app.post('/wishlist/add', ensureAuthenticated, async (req, res) => {
    try {
      const { propertyId } = req.body;
      if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
      const property = await storage.getPropertyById(propertyId);
      if (!property) return res.status(404).json({ error: 'Property not found' });
      let imagePreview = '';
      if (property.images && property.images[0]) {
        if (typeof property.images[0] === 'string') {
          imagePreview = property.images[0];
        } else {
          imagePreview = property.images[0].default || (property.images[0].formats && property.images[0].formats.length ? property.images[0].formats[0].src : '');
        }
      }
      const payload = { id: propertyId, title: property.title, city: property.city, price: property.price, image: imagePreview };
      const ok = await addToWishlist(req.session.userEmail, payload);
      if (!ok) return res.status(500).json({ error: 'Failed to add to wishlist' });
      
      req.session.userWishlist = req.session.userWishlist || [];
      if (!req.session.userWishlist.find(p => String(p.id) === String(propertyId))) {
        req.session.userWishlist.push(payload);
      }
      req.session.save((err) => {
        if (err) console.error('Session save error:', err);
      });
      return res.json({ success: true, item: payload });
    } catch (err) {
      console.error('Wishlist add error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/wishlist/remove', ensureAuthenticated, async (req, res) => {
    try {
      const { propertyId } = req.body;
      if (!propertyId) return res.status(400).json({ error: 'propertyId required' });
      const ok = await removeFromWishlist(req.session.userEmail, propertyId);
      if (!ok) return res.status(500).json({ error: 'Failed to remove from wishlist' });
     
      if (req.session.userWishlist) {
        req.session.userWishlist = req.session.userWishlist.filter(p => String(p.id) !== String(propertyId));
      }
      req.session.save((err) => {
        if (err) console.error('Session save error:', err);
      });
      return res.json({ success: true });
    } catch (err) {
      console.error('Wishlist remove error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get("/api/properties", async (req, res) => {
    try {
      const { city, minPrice, maxPrice, roomType, amenities, genderPreference, propertyType, sortBy, search } = req.query;

      let properties = await storage.getProperties();

      if (search && typeof search === "string") {
        const searchLower = search.toLowerCase();
        properties = properties.filter(
          (p) =>
            p.title.toLowerCase().includes(searchLower) ||
            p.area.toLowerCase().includes(searchLower) ||
            p.city.toLowerCase().includes(searchLower)
        );
      }

      if (city && typeof city === "string") {
        const decodedCity = decodeURIComponent(city);
        properties = properties.filter((p) => p.city.toLowerCase() === decodedCity.toLowerCase());
      }

      if (minPrice && typeof minPrice === "string") {
        const min = parseInt(minPrice);
        properties = properties.filter((p) => p.price >= min);
      }

      if (maxPrice && typeof maxPrice === "string") {
        const max = parseInt(maxPrice);
        properties = properties.filter((p) => p.price <= max);
      }

      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch properties" });
    }
  });

  app.get("/api/properties/:id", async (req, res) => {
    try {
      const property = await storage.getPropertyById(req.params.id);
      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch property" });
    }
  });

  app.get("/api/cities", async (req, res) => {
    try {
      const cities = await storage.getCities();
      res.json(cities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cities" });
    }
  });

 
  app.get("/booking/:propertyId", ensureAuthenticated, async (req, res) => {
    try {
      const { propertyId } = req.params;
      const property = await storage.getPropertyById(propertyId);
      
      if (!property) {
        return res.status(404).send("Property not found");
      }

      const user = await findUserByEmail(req.session.userEmail);
      res.render("booking", { property, user, error: null });
    } catch (error) {
      console.error("Error rendering booking page:", error);
      res.status(500).send("Error loading booking page");
    }
  });

  app.get('/booking/admin/:bookingId', ensureAuthenticated, async (req, res) => {
    try {
      const { bookingId } = req.params;
      const booking = await storage.getBookingById(bookingId);
      if (!booking) return res.status(404).send('Booking not found');
      if (booking.email !== req.session.userEmail) return res.status(403).send('Forbidden');

      
      let qrDataUrl = null;
      try {
        const qrcode = await import('qrcode');
        const payload = JSON.stringify({ bookingId: booking.id, email: booking.email, propertyId: booking.propertyId });
        qrDataUrl = await qrcode.toDataURL(payload);
      } catch (err) {
        console.warn('QR generation failed', err && err.message);
      }

      const complaints = await storage.getComplaintsByBookingId(bookingId);
      res.render('booking-admin', { booking, qrDataUrl, complaints });
    } catch (err) {
      console.error('Error rendering booking admin', err);
      return res.status(500).send('Error loading admin page');
    }
  });

  app.post('/booking/meal/:bookingId', ensureAuthenticated, async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { mealPreference, meals } = req.body;
      const booking = await storage.getBookingById(bookingId);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
      if (booking.email !== req.session.userEmail) return res.status(403).json({ error: 'Forbidden' });
      const ok = await storage.updateBookingMealPreference(req.session.userEmail, bookingId, mealPreference, meals || null);
      if (!ok) return res.status(500).json({ error: 'Failed to update meal preference' });
      return res.json({ success: true });
    } catch (err) {
      console.error('Meal preference error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/booking/complaint/:bookingId', ensureAuthenticated, async (req, res) => {
    try {
      const { bookingId } = req.params;
      const { message } = req.body;
      if (!message || typeof message !== 'string' || !message.trim()) return res.status(400).json({ error: 'Message required' });
      const booking = await storage.getBookingById(bookingId);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
      if (booking.email !== req.session.userEmail) return res.status(403).json({ error: 'Forbidden' });
      const complaint = await storage.createComplaint(req.session.userEmail, bookingId, { message: message.trim() });
      if (!complaint) return res.status(500).json({ error: 'Failed to create complaint' });
      return res.json({ success: true, complaint });
    } catch (err) {
      console.error('Create complaint error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/booking", ensureAuthenticated, async (req, res) => {
    try {
      const { propertyId, tenantName, tenantPhone, tenantAddress, aadhaarNumber } = req.body;
      
      if (!propertyId || !tenantName || !tenantPhone || !tenantAddress || !aadhaarNumber) {
        const property = await storage.getPropertyById(propertyId);
        return res.status(400).render("booking", { 
          property, 
          user: null, 
          error: "Please provide all required fields including Aadhaar number" 
        });
      }

      const property = await storage.getPropertyById(propertyId);
      if (!property) {
        return res.status(404).send("Property not found");
      }

      const bookingData = {
        propertyId,
        propertyTitle: property.title,
        propertyPrice: property.price,
        tenantName,
        tenantPhone,
        tenantAddress,
        aadhaarNumber
      };

      const booking = await createBooking(req.session.userEmail, bookingData);
      
      if (!booking) {
        const user = await findUserByEmail(req.session.userEmail);
        return res.status(500).render("booking", { 
          property, 
          user, 
          error: "Failed to create booking" 
        });
      }

      req.session.successMessage = `Booking confirmed! First month is free for ${property.title}.`;
      res.redirect("/profile");
    } catch (error) {
      console.error("Booking error:", error);
      res.status(500).send("Error processing booking");
    }
  });

  app.post("/booking/cancel/:bookingId", ensureAuthenticated, async (req, res) => {
    try {
      const { bookingId } = req.params;
      const cancelled = await cancelBooking(req.session.userEmail, bookingId);
      
      if (!cancelled) {
        return res.status(404).json({ error: "Booking not found" });
      }

      req.session.successMessage = "Booking cancelled successfully.";
      return res.json({ success: true });
    } catch (error) {
      console.error("Booking cancellation error:", error);
      return res.status(500).json({ error: "Failed to cancel booking" });
    }
  });


  app.post("/review", ensureAuthenticated, async (req, res) => {
    try {
      const { propertyId, studentName, university, rating, comment } = req.body;

      if (!propertyId || !studentName || !university || !rating || !comment) {
        return res.status(400).json({ error: "Please provide all required fields" });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      const reviewData = {
        studentName: studentName.trim(),
        university: university.trim(),
        rating: parseInt(rating),
        comment: comment.trim()
      };

      const review = await storage.createReview(propertyId, reviewData);

      if (!review) {
        return res.status(500).json({ error: "Failed to create review" });
      }

      return res.json({ success: true, review });
    } catch (error) {
      console.error("Review creation error:", error);
      return res.status(500).json({ error: "Failed to create review" });
    }
  });

  app.get("/api/reviews/:propertyId", async (req, res) => {
    try {
      const { propertyId } = req.params;
      const reviews = await storage.getReviewsByPropertyId(propertyId);
      return res.json(reviews);
    } catch (error) {
      console.error("Reviews fetch error:", error);
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
