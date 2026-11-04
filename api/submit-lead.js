import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error('MONGODB_URI environment variable missing');
  }

  const client = new MongoClient(uri, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });

  await client.connect();
  const db = client.db('mayura_jewelers');

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, city, couponCode, prize } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and Phone are required' });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('leads');

    const leadDocument = {
      name,
      phone,
      city: city || 'Mumbai',
      couponCode,
      prize,
      createdAt: new Date()
    };

    const result = await collection.insertOne(leadDocument);

    return res.status(200).json({
      success: true,
      message: 'Lead saved successfully',
      id: result.insertedId
    });
  } catch (error) {
    console.error('MongoDB Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}