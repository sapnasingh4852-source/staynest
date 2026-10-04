import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';

process.env.JWT_SECRET = 'test-secret';

import app from '../src/app.js';
import generateToken from '../src/utils/generateToken.js';
import User from '../src/models/User.js';
import Listing from '../src/models/Listing.js';
import Booking from '../src/models/Booking.js';

const DAY = 24 * 60 * 60 * 1000;
const iso = (offsetDays) => new Date(Date.now() + offsetDays * DAY).toISOString();

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((c) => c.deleteMany({})));
});

let seq = 0;
const makeUser = (role) =>
  User.create({
    name: role,
    email: `${role}-${Date.now()}-${seq++}@test.com`,
    password: 'pass1234',
    role,
  });

const makeListing = (host, overrides = {}) =>
  Listing.create({
    title: 'Beach Villa',
    description: 'A lovely place',
    type: 'villa',
    city: 'Goa',
    state: 'GA',
    address: '1 Shore Road',
    pricePerNight: 5000,
    maxGuests: 4,
    host: host._id,
    ...overrides,
  });

const auth = (user) => ({ Authorization: `Bearer ${generateToken(user._id)}` });

describe('POST /api/bookings', () => {
  test('creates a booking with correct nights and total price (201)', async () => {
    const host = await makeUser('host');
    const guest = await makeUser('guest');
    const listing = await makeListing(host);

    const res = await request(app)
      .post('/api/bookings')
      .set(auth(guest))
      .send({
        listingId: listing._id.toString(),
        checkIn: iso(1),
        checkOut: iso(4),
        guests: 2,
      });

    expect(res.status).toBe(201);
    expect(res.body.nights).toBe(3);
    expect(res.body.totalPrice).toBe(15000);
    expect(res.body.status).toBe('pending');
    expect(res.body.listing).toBe(listing._id.toString());
    expect(res.body.guest).toBe(guest._id.toString());

    const saved = await Booking.findById(res.body._id);
    expect(saved).toBeTruthy();
  });

  test('rejects check-out before check-in (400)', async () => {
    const host = await makeUser('host');
    const guest = await makeUser('guest');
    const listing = await makeListing(host);

    const res = await request(app)
      .post('/api/bookings')
      .set(auth(guest))
      .send({
        listingId: listing._id.toString(),
        checkIn: iso(5),
        checkOut: iso(2),
        guests: 2,
      });

    expect(res.status).toBe(400);
    await expect(Booking.countDocuments()).resolves.toBe(0);
  });

  test('rejects more guests than the listing allows (400)', async () => {
    const host = await makeUser('host');
    const guest = await makeUser('guest');
    const listing = await makeListing(host, { maxGuests: 2 });

    const res = await request(app)
      .post('/api/bookings')
      .set(auth(guest))
      .send({
        listingId: listing._id.toString(),
        checkIn: iso(1),
        checkOut: iso(3),
        guests: 5,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/maximum of 2 guests/);
  });

  test('rejects a host booking their own listing (400)', async () => {
    const host = await makeUser('host');
    const listing = await makeListing(host);

    const res = await request(app)
      .post('/api/bookings')
      .set(auth(host))
      .send({
        listingId: listing._id.toString(),
        checkIn: iso(1),
        checkOut: iso(3),
        guests: 2,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot book your own listing/i);
  });

  test('rejects an unknown listing (404)', async () => {
    const guest = await makeUser('guest');
    const missingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post('/api/bookings')
      .set(auth(guest))
      .send({
        listingId: missingId,
        checkIn: iso(1),
        checkOut: iso(3),
        guests: 2,
      });

    expect(res.status).toBe(404);
  });

  test('requires authentication (401)', async () => {
    const host = await makeUser('host');
    const listing = await makeListing(host);

    const res = await request(app)
      .post('/api/bookings')
      .send({
        listingId: listing._id.toString(),
        checkIn: iso(1),
        checkOut: iso(3),
        guests: 2,
      });

    expect(res.status).toBe(401);
  });
});
