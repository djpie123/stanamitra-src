import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, 'mongo-config.json');

let client;
let db;
const memUsers = new Map();

function readConfig() {
  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not read mongo-config.json; falling back to default localhost', err);
    return { uri: 'mongodb://localhost:27017', dbName: 'sthanamitra' };
  }
}

export async function connect() {
  const cfg = readConfig();
  if (!client) {
    
    const options = { useUnifiedTopology: true, serverSelectionTimeoutMS: 3000, connectTimeoutMS: 3000 };
    client = new MongoClient(cfg.uri, options);
    try {
      await client.connect();
      db = client.db(cfg.dbName);
      await ensureIndexes();
    } catch (err) {
      
      client = undefined;
      db = undefined;
      console.error('MongoDB connect failed in auth.connect:', err.message || err);
      throw err; 
    }
  }
  return db;
}

export function getMongoClient() {
  return client || null;
}

async function ensureIndexes() {
  const users = db.collection('users');
  await users.createIndex({ email: 1 }, { unique: true });
  const properties = db.collection('properties');
  await properties.createIndex({ id: 1 });
  const cities = db.collection('cities');
  await cities.createIndex({ id: 1 });
}

export async function findUserByEmail(email) {
  try {
    await connect();
    return await db.collection('users').findOne({ email });
  } catch (err) {

    return Array.from(memUsers.values()).find(u => u.email === email) || null;
  }
}

export async function createUser({ name, email, password }) {
  const hashed = bcrypt.hashSync(password, 10);
  try {
    await connect();
    const res = await db.collection('users').insertOne({ name, email, password: hashed, createdAt: new Date(), wishlist: [] });
    return res.insertedId;
  } catch (err) {
  
    if (err && err.code === 11000) throw err;
   
    const existing = Array.from(memUsers.values()).find(u => u.email === email);
    if (existing) {
      const error = new Error('User already exists');
      error.code = 11000;
      throw error;
    }
    const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    memUsers.set(id, { id, name, email, password: hashed, createdAt: new Date(), wishlist: [] });
    return id;
  }
}

export async function addToWishlist(email, property) {
  try {
    await connect();
    const update = await db.collection('users').updateOne({ email }, { $addToSet: { wishlist: property } });
    return update.matchedCount > 0;
  } catch (err) {
    const existing = Array.from(memUsers.values()).find(u => u.email === email);
    if (!existing) return false;
    existing.wishlist = existing.wishlist || [];
    if (!existing.wishlist.find(p => String(p.id) === String(property.id))) {
      existing.wishlist.push(property);
    }
    memUsers.set(existing.id || existing.id, existing);
    return true;
  }
}

export async function removeFromWishlist(email, propertyId) {
  try {
    await connect();
    const update = await db.collection('users').updateOne({ email }, { $pull: { wishlist: { id: propertyId } } });
    return update.matchedCount > 0;
  } catch (err) {
    const existing = Array.from(memUsers.values()).find(u => u.email === email);
    if (!existing || !existing.wishlist) return false;
    existing.wishlist = existing.wishlist.filter(p => String(p.id) !== String(propertyId));
    memUsers.set(existing.id || existing.id, existing);
    return true;
  }
}

export async function verifyUser(email, password) {
  let user;
  try {
    await connect();
    user = await findUserByEmail(email);
  } catch (err) {
   
    user = await findUserByEmail(email);
  }
  if (!user) return null;
  const match = bcrypt.compareSync(password, user.password);
  if (match) return user;
  return null;
}

export async function updateUser(email, updates) {
  await connect();
 
  try {
    const res = await db.collection('users').findOneAndUpdate({ email }, { $set: { ...updates, updatedAt: new Date() } }, { returnDocument: 'after' });
    return res.value || null;
  } catch (err) {
   
    const existing = Array.from(memUsers.values()).find(u => u.email === email);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    memUsers.set(updated.id || existing.id, updated);
    return updated;
  }
}

export async function createBooking(email, bookingData) {
  const booking = {
    id: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    email,
    propertyId: bookingData.propertyId,
    propertyTitle: bookingData.propertyTitle,
    propertyPrice: bookingData.propertyPrice,
    tenantName: bookingData.tenantName,
    tenantPhone: bookingData.tenantPhone,
    tenantAddress: bookingData.tenantAddress,
    aadhaarNumber: bookingData.aadhaarNumber,
    bookingDate: new Date(),
    freeMonthEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
    status: 'confirmed',
    mealPreference: bookingData.mealPreference || null
  };
  
  try {
    await connect();
    const result = await db.collection('bookings').insertOne(booking);
    return { ...booking, _id: result.insertedId };
  } catch (err) {
    console.error('MongoDB booking insert failed, using memory fallback:', err.message);
    
    const user = Array.from(memUsers.values()).find(u => u.email === email);
    if (!user) return null;
    user.bookings = user.bookings || [];
    user.bookings.push(booking);
    return booking;
  }
}

export async function getBookingById(bookingId) {
  try {
    await connect();
    return await db.collection('bookings').findOne({ id: bookingId });
  } catch (err) {
    console.error('MongoDB getBookingById failed:', err.message);
    const user = Array.from(memUsers.values()).find(u => u.bookings && u.bookings.find(b => b.id === bookingId));
    if (!user) return null;
    return user.bookings.find(b => b.id === bookingId) || null;
  }
}

export async function updateBookingMealPreference(email, bookingId, mealPreference, meals = null) {
  try {
    await connect();
    const result = await db.collection('bookings').updateOne({ id: bookingId, email }, { $set: { mealPreference, meals, updatedAt: new Date() } });
    return result.matchedCount > 0;
  } catch (err) {
    console.error('MongoDB updateBookingMealPreference failed:', err.message);
    const user = Array.from(memUsers.values()).find(u => u.email === email);
    if (!user || !user.bookings) return false;
    const booking = user.bookings.find(b => b.id === bookingId);
    if (!booking) return false;
    booking.mealPreference = mealPreference;
    booking.meals = meals;
    booking.updatedAt = new Date();
    return true;
  }
}

export async function createComplaint(email, bookingId, complaintData) {
  const complaint = {
    id: `complaint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    bookingId,
    email,
    message: complaintData.message,
    status: 'open',
    createdAt: new Date(),
    expectedResolveBy: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
  };
  try {
    await connect();
    const res = await db.collection('complaints').insertOne(complaint);
    return { ...complaint, _id: res.insertedId };
  } catch (err) {
    console.error('MongoDB createComplaint failed:', err.message);
    const user = Array.from(memUsers.values()).find(u => u.email === email);
    if (!user) return null;
    user.complaints = user.complaints || [];
    user.complaints.push(complaint);
    return complaint;
  }
}

export async function getComplaintsByBookingId(bookingId) {
  try {
    await connect();
    const complaints = await db.collection('complaints').find({ bookingId }).toArray();
   
    for (const c of complaints) {
      if (c.status === 'open' && c.expectedResolveBy && new Date(c.expectedResolveBy) < now) {
        await db.collection('complaints').updateOne({ id: c.id }, { $set: { status: 'resolved', resolvedAt: now } });
        c.status = 'resolved';
        c.resolvedAt = now;
      }
    }
    return complaints;
  } catch (err) {
    console.error('MongoDB getComplaintsByBookingId failed:', err.message);
    const users = Array.from(memUsers.values());
    const found = [];
    users.forEach(u => {
      (u.complaints || []).forEach(c => { if (c.bookingId === bookingId) found.push(c); });
    });
   
    const now = new Date();
    found.forEach(c => { if (c.status === 'open' && c.expectedResolveBy && new Date(c.expectedResolveBy) < now) { c.status = 'resolved'; c.resolvedAt = now; } });
    return found;
  }
}

export async function getBookingsByUser(email) {
  try {
    await connect();
    return await db.collection('bookings').find({ email }).toArray();
  } catch (err) {
    console.error('MongoDB bookings query failed, using memory fallback:', err.message);
    const user = Array.from(memUsers.values()).find(u => u.email === email);
    if (!user) return [];
    return user.bookings || [];
  }
}

export async function cancelBooking(email, bookingId) {
  try {
    await connect();
    const result = await db.collection('bookings').updateOne({ id: bookingId, email }, { $set: { status: 'cancelled', cancelledAt: new Date() } });
    return result.matchedCount > 0;
  } catch (err) {
    console.error('MongoDB booking cancel failed, using memory fallback:', err.message);
    const user = Array.from(memUsers.values()).find(u => u.email === email);
    if (!user || !user.bookings) return false;
    const booking = user.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = 'cancelled';
      booking.cancelledAt = new Date();
      return true;
    }
    return false;
  }
}


export async function getProperties() {
  try {
    await connect();
    const props = await db.collection('properties').find({}).toArray();
    console.log('[auth.getProperties] Found', props.length, 'properties in DB');
    return props.length > 0 ? props : null;
  } catch (err) {
    console.error('MongoDB properties query failed, using memory fallback:', err.message);
    return null;
  }
}

export async function getPropertyById(id) {
  try {
    await connect();
    return await db.collection('properties').findOne({ id });
  } catch (err) {
    console.error('MongoDB property query failed:', err.message);
    return null;
  }
}

export async function getCities() {
  try {
    await connect();
    const cities = await db.collection('cities').find({}).toArray();
    return cities.length > 0 ? cities : null;
  } catch (err) {
    console.error('MongoDB cities query failed:', err.message);
    return null;
  }
}

export async function createProperty(propertyData) {
  const property = {
    id: propertyData.id || `prop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: propertyData.title,
    description: propertyData.description,
    propertyType: propertyData.propertyType || 'pg',
    city: propertyData.city || '',
    area: propertyData.area || '',
    price: parseInt(propertyData.price) || 0,
    images: propertyData.images || [],
    amenities: propertyData.amenities || [],
    roomType: propertyData.roomType || 'single',
    genderPreference: propertyData.genderPreference || 'any',
    verified: propertyData.verified || false,
    rating: propertyData.rating ? String(propertyData.rating) : '0.0',
    totalReviews: propertyData.totalReviews || 0,
    distanceFromCollege: propertyData.distanceFromCollege || 0,
    availableRooms: propertyData.availableRooms || 0,
    createdAt: new Date(),
    createdBy: propertyData.createdBy || null
  };

  try {
    await connect();
    const result = await db.collection('properties').insertOne(property);
    console.log('[auth.createProperty] Inserted property:', property.id, 'with MongoDB _id:', result.insertedId);
    return { ...property, _id: result.insertedId };
  } catch (err) {
    console.error('MongoDB property insert failed:', err.message);
    return null;
  }
}


export async function createReview(propertyId, reviewData) {
  const review = {
    id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    propertyId,
    studentName: reviewData.studentName,
    university: reviewData.university,
    rating: parseInt(reviewData.rating),
    comment: reviewData.comment,
    date: new Date(),
    status: 'pending' 
  };

  try {
    await connect();
    const result = await db.collection('reviews').insertOne(review);
    return { ...review, _id: result.insertedId };
  } catch (err) {
    console.error('MongoDB review insert failed:', err.message);
    return null;
  }
}

export async function getReviewsByPropertyId(propertyId) {
  try {
    await connect();
    return await db.collection('reviews').find({ propertyId, status: 'approved' }).toArray();
  } catch (err) {
    console.error('MongoDB reviews query failed:', err.message);
    return [];
  }
}

export async function getAllReviews() {
  try {
    await connect();
    return await db.collection('reviews').find({}).toArray();
  } catch (err) {
    console.error('MongoDB reviews query failed:', err.message);
    return [];
  }
}

export default { connect, findUserByEmail, createUser, verifyUser, updateUser, addToWishlist, removeFromWishlist, createBooking, getBookingsByUser, cancelBooking, getBookingById, updateBookingMealPreference, createComplaint, getComplaintsByBookingId, getProperties, getPropertyById, getCities, createProperty, createReview, getReviewsByPropertyId, getAllReviews };
