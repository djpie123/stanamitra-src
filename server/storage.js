import { randomUUID } from "crypto";
import * as auth from "./auth.js";

const modernSingleRoomImage = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80";
const hostelRoomImage = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80";
const apartmentImage = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80";
const girlsHostelImage = "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80";
const boysPgImage = "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80";

export class MemStorage {
  constructor() {
    this.properties = new Map();
    this.cities = new Map();
    this.reviews = new Map();
    this.bookings = new Map();
    this.initializeData();
  }

  initializeData() {
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

    cityData.forEach(city => {
      const id = randomUUID();
      this.cities.set(id, { id, ...city });
    });

    const propertyData = [
      {
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

    propertyData.forEach(property => {
      const id = randomUUID();
      this.properties.set(id, { id, ...property });
    });

    const reviewData = [
      {
        propertyIndex: 0,
        review: {
          studentName: "Rahul Verma",
          studentPhoto: "",
          university: "IIT Mumbai",
          rating: 5,
          comment: "Excellent PG with great facilities. The owner is very cooperative and the food is amazing. Highly recommended for IIT students!",
          date: "2024-01-15",
        },
      },
      {
        propertyIndex: 0,
        review: {
          studentName: "Sneha Patel",
          studentPhoto: "",
          university: "IIT Mumbai",
          rating: 5,
          comment: "Very close to campus and the room is spacious. WiFi speed is great for online classes. Worth every penny!",
          date: "2024-02-20",
        },
      },
      {
        propertyIndex: 1,
        review: {
          studentName: "Priya Sharma",
          studentPhoto: "",
          university: "Delhi University",
          rating: 5,
          comment: "Safe and secure environment. The warden is very caring and the food is homely. Perfect for girls studying in DU!",
          date: "2024-01-10",
        },
      },
      {
        propertyIndex: 1,
        review: {
          studentName: "Anjali Reddy",
          studentPhoto: "",
          university: "Delhi University",
          rating: 5,
          comment: "Great hostel with excellent amenities. Study room is very helpful during exams. Highly recommend!",
          date: "2024-03-05",
        },
      },
    ];

    const propertiesArray = Array.from(this.properties.values());
    reviewData.forEach(({ propertyIndex, review }) => {
      const property = propertiesArray[propertyIndex];
      if (property) {
        const id = randomUUID();
        this.reviews.set(id, {
          id,
          propertyId: property.id,
          ...review,
        });
      }
    });
  }

  async getProperties() {
   
    const dbProps = await auth.getProperties();
    if (dbProps) return dbProps;
   
    return Array.from(this.properties.values());
  }

  async getPropertyById(id) {
    
    const dbProp = await auth.getPropertyById(id);
    if (dbProp) return dbProp;
    
    return this.properties.get(id);
  }

  async getCities() {
   
    const dbCities = await auth.getCities();
    if (dbCities) return dbCities;
    
    return Array.from(this.cities.values());
  }

  async getReviewsByPropertyId(propertyId) {
    
    const dbReviews = await auth.getReviewsByPropertyId(propertyId);
    if (dbReviews && dbReviews.length > 0) return dbReviews;
    
    return Array.from(this.reviews.values()).filter(
      review => review.propertyId === propertyId
    );
  }

  async createReview(propertyId, reviewData) {
   
    const dbReview = await auth.createReview(propertyId, reviewData);
    if (dbReview) return dbReview;
    
    const id = randomUUID();
    const review = { id, propertyId, ...reviewData, date: new Date() };
    this.reviews.set(id, review);
    return review;
  }

  async createProperty(propertyData) {
   
    console.log('[storage.createProperty] Creating property:', propertyData.title);
    const dbProperty = await auth.createProperty(propertyData);
    if (dbProperty) {
      console.log('[storage.createProperty] Successfully created in DB');
      return dbProperty;
    }
    
    const id = randomUUID();
    const property = {
      id,
      ...propertyData,
      images: propertyData.images || [],
      amenities: propertyData.amenities || [],
      createdAt: new Date(),
    };
    console.log('[storage.createProperty] Fallback to memory storage');
    this.properties.set(id, property);
    return property;
  }

  async createBooking(booking) {
    const id = randomUUID();
    this.bookings.set(id, { id, ...booking });
    return { id, ...booking };
  }

  async getBookingsByUser(email) {
    return Array.from(this.bookings.values()).filter(
      booking => booking.email === email
    );
  }
}

export const storage = new MemStorage();
