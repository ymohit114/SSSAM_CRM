import mongoose from 'mongoose';

const DEFAULT_URI = 'mongodb://mohit_app:mohit_app@ac-ft2q9tn-shard-00-00.iye3brk.mongodb.net:27017,ac-ft2q9tn-shard-00-01.iye3brk.mongodb.net:27017,ac-ft2q9tn-shard-00-02.iye3brk.mongodb.net:27017/sssam_academy?ssl=true&replicaSet=atlas-14av5y-shard-0&authSource=admin&appName=Cluster0';
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_URI;

/**
 * Global is used here to maintain a cached connection across hot reloads in development.
 * This prevents connections growing exponentially during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    const connectionString = MONGODB_URI || DEFAULT_URI;

    cached.promise = mongoose.connect(connectionString, opts).then((mongooseInstance) => {
      console.log('✅ Connected to MongoDB Atlas successfully!');
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      console.warn('⚠️ MongoDB connection warning:', err.message);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
