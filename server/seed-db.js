import { connect } from "./auth.js";
import { randomUUID } from "crypto";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const modernSingleRoomImage = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80";
const hostelRoomImage = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80";
const apartmentImage = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80";
const girlsHostelImage = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80";
const boysPgImage = "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80";

function readConfig() {
  try {
    const configPath = path.join(__dirname, 'mongo-config.json');
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return { uri: 'mongodb://localhost:27017', dbName: 'sthanamitra' };
  }
}

async function seedDatabase() {
  let client;
  try {
    const cfg = readConfig();
    client = new MongoClient(cfg.uri, { useUnifiedTopology: true });
    await client.connect();
    const db = client.db(cfg.dbName);

   
    await db.collection('cities').deleteMany({});
    await db.collection('properties').deleteMany({});

    
    const cityData = [
      { name: "Mumbai", image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80", propertyCount: 45 },
      { name: "Delhi", image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80", propertyCount: 52 },
      { name: "Bangalore", image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=800&q=80", propertyCount: 68 },
      { name: "Pune", image: "https://images.unsplash.com/photo-1595658658481-d53d3f999875?w=800&q=80", propertyCount: 38 },
      { name: "Hyderabad", image: "https://images.unsplash.com/photo-1696941515998-d83f24967aca?q=80&w=736&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", propertyCount: 42 },
      { name: "Chennai", image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800&q=80", propertyCount: 35 },
      { name: "Kolkata", image: "https://images.unsplash.com/photo-1558431382-27e303142255?w=800&q=80", propertyCount: 28 },
      { name: "Ahmedabad", image: "https://images.unsplash.com/photo-1609137144813-7d9921338f24?w=800&q=80", propertyCount: 24 },
    ];

    const cities = await db.collection('cities').insertMany(
      cityData.map(city => ({ id: randomUUID(), ...city }))
    );

    console.log(`✓ Seeded ${cities.insertedCount} cities`);

   
    const propertyData = [
      {
        id: randomUUID(),
        title: "Modern Single Room PG near IIT Mumbai",
        description: "Spacious single room with attached bathroom in a well-maintained PG. Located just 2km from IIT Mumbai campus. Includes WiFi, meals, and laundry services. Safe and secure environment with 24/7 security and CCTV surveillance.",
        propertyType: "pg",
        city: "Mumbai",
        area: "Powai",
        price: 15000,
        images: [modernSingleRoomImage, hostelRoomImage, apartmentImage],
        amenities: ["WiFi", "Meals", "Laundry", "Security", "AC"],
        roomType: "single",
        genderPreference: "any",
        verified: true,
        rating: "4.8",
        totalReviews: 24,
        distanceFromCollege: 2,
        availableRooms: 3,
      },
      {
        id: randomUUID(),
        title: "Girls Hostel - Delhi University Area",
        description: "Safe and comfortable girls-only hostel near Delhi University. Features include study room, common area, and nutritious meals. Strict security with biometric access and women security guards available 24/7.",
        propertyType: "hostel",
        city: "Delhi",
        area: "North Campus",
        price: 12000,
        images: [girlsHostelImage, modernSingleRoomImage, hostelRoomImage],
        amenities: ["WiFi", "Meals", "Security", "Laundry", "Study Room"],
        roomType: "double",
        genderPreference: "female",
        verified: true,
        rating: "4.9",
        totalReviews: 42,
        distanceFromCollege: 1,
        availableRooms: 5,
      },
      {
        id: randomUUID(),
        title: "Premium 2BHK Flat for Students - Bangalore",
        description: "Fully furnished 2BHK apartment perfect for 3-4 students. Modern amenities, high-speed internet, and close to major tech parks. Ideal for working professionals and students. Includes parking space and 24/7 water supply.",
        propertyType: "flat",
        city: "Bangalore",
        area: "Koramangala",
        price: 35000,
        images: [apartmentImage, modernSingleRoomImage, hostelRoomImage],
        amenities: ["WiFi", "Parking", "Security", "AC", "Gym"],
        roomType: "shared",
        genderPreference: "any",
        verified: true,
        rating: "4.7",
        totalReviews: 18,
        distanceFromCollege: 5,
        availableRooms: 1,
      },
      {
        id: randomUUID(),
        title: "Budget Boys PG near Pune University",
        description: "Affordable PG accommodation for boys near Pune University. Clean rooms, home-cooked meals, and friendly environment. Perfect for students on a budget. Includes basic amenities and common study area.",
        propertyType: "pg",
        city: "Pune",
        area: "Shivajinagar",
        price: 8000,
        images: [boysPgImage, modernSingleRoomImage, hostelRoomImage],
        amenities: ["WiFi", "Meals", "Laundry", "Security"],
        roomType: "triple",
        genderPreference: "male",
        verified: true,
        rating: "4.5",
        totalReviews: 31,
        distanceFromCollege: 3,
        availableRooms: 4,
      },
      {
        id: randomUUID(),
        title: "AC Hostel Rooms - Hyderabad BITS Campus",
        description: "Air-conditioned hostel rooms with modern facilities near BITS Pilani Hyderabad campus. Includes high-speed WiFi, study area, recreation room, and healthy meals. Well-connected to the city center.",
        propertyType: "hostel",
        city: "Hyderabad",
        area: "Shamirpet",
        price: 14000,
        images: [hostelRoomImage, modernSingleRoomImage, girlsHostelImage],
        amenities: ["WiFi", "AC", "Meals", "Security", "Study Room", "Recreation"],
        roomType: "double",
        genderPreference: "any",
        verified: true,
        rating: "4.6",
        totalReviews: 27,
        distanceFromCollege: 2,
        availableRooms: 6,
      },
      {
        id: randomUUID(),
        title: "Luxury PG for Working Professionals - Bangalore",
        description: "Premium PG accommodation in the heart of Bangalore. Perfect for students and young professionals. Features include gym, swimming pool, and rooftop lounge. Fully furnished rooms with modern amenities.",
        propertyType: "pg",
        city: "Bangalore",
        area: "Indiranagar",
        price: 22000,
        images: [modernSingleRoomImage, apartmentImage, hostelRoomImage],
        amenities: ["WiFi", "AC", "Gym", "Parking", "Security", "Meals"],
        roomType: "single",
        genderPreference: "any",
        verified: true,
        rating: "4.9",
        totalReviews: 35,
        distanceFromCollege: 4,
        availableRooms: 2,
      },
      {
        id: randomUUID(),
        title: "Women's PG near Mumbai University",
        description: "Safe and secure women-only PG near Mumbai University. Homely environment with nutritious meals and all basic amenities. Located in a peaceful residential area with easy access to public transport.",
        propertyType: "pg",
        city: "Mumbai",
        area: "Kalina",
        price: 13000,
        images: [girlsHostelImage, modernSingleRoomImage, hostelRoomImage],
        amenities: ["WiFi", "Meals", "Laundry", "Security", "AC"],
        roomType: "double",
        genderPreference: "female",
        verified: true,
        rating: "4.8",
        totalReviews: 29,
        distanceFromCollege: 1,
        availableRooms: 3,
      },
      {
        id: randomUUID(),
        title: "Student Flat Sharing - Delhi South Campus",
        description: "Spacious 3BHK flat available for student sharing near Delhi South Campus. Fully furnished with modern kitchen, washing machine, and high-speed internet. Perfect for groups of friends.",
        propertyType: "flat",
        city: "Delhi",
        area: "Saket",
        price: 28000,
        images: [apartmentImage, modernSingleRoomImage, hostelRoomImage],
        amenities: ["WiFi", "Parking", "Security", "AC"],
        roomType: "shared",
        genderPreference: "any",
        verified: true,
        rating: "4.6",
        totalReviews: 15,
        distanceFromCollege: 3,
        availableRooms: 1,
      },
      {
        id: randomUUID(),
        title: "Affordable Hostel - Chennai Anna University",
        description: "Budget-friendly hostel near Anna University with all essential amenities. Clean and well-maintained rooms with study facilities. Regular housekeeping and laundry services included.",
        propertyType: "hostel",
        city: "Chennai",
        area: "Guindy",
        price: 9500,
        images: [hostelRoomImage, boysPgImage, modernSingleRoomImage],
        amenities: ["WiFi", "Meals", "Laundry", "Security", "Study Room"],
        roomType: "triple",
        genderPreference: "any",
        verified: true,
        rating: "4.4",
        totalReviews: 22,
        distanceFromCollege: 2,
        availableRooms: 8,
      },
      {
        id: randomUUID(),
        title: "Premium Girls Hostel - Pune IT Park",
        description: "Upscale girls hostel near Hinjewadi IT Park. Features include gym, library, rooftop terrace, and cafe. Professional atmosphere perfect for students and working women. Top-notch security and facilities.",
        propertyType: "hostel",
        city: "Pune",
        area: "Hinjewadi",
        price: 18000,
        images: [girlsHostelImage, modernSingleRoomImage, apartmentImage],
        amenities: ["WiFi", "AC", "Gym", "Meals", "Security", "Study Room", "Recreation"],
        roomType: "single",
        genderPreference: "female",
        verified: true,
        rating: "4.9",
        totalReviews: 38,
        distanceFromCollege: 5,
        availableRooms: 4,
      },
    ];

    const properties = await db.collection('properties').insertMany(propertyData);
    console.log(`✓ Seeded ${properties.insertedCount} properties`);

    console.log("✓ Database seeding completed successfully!");
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
