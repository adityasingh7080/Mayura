const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  if (!uri) throw new Error("MONGODB_URI is not configured in Vercel Environment Variables");

  const client = await MongoClient.connect(uri, {
    maxPoolSize: 10
  });
  cachedClient = client;
  return client;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, phone, city, couponCode, prize } = req.body || {};

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and Phone number are required' });
    }

    const client = await connectToDatabase();
    const db = client.db('mayura_jewelers');
    const collection = db.collection('leads');

    const result = await collection.insertOne({
      name,
      phone,
      city: city || 'Not provided',
      couponCode,
      prize,
      createdAt: new Date()
    });

    return res.status(200).json({ success: true, leadId: result.insertedId });
  } catch (error) {
    console.error("MongoDB Insert Error:", error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};