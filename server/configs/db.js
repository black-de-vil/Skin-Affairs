import mongoose from 'mongoose';

// Reuse one connection. Serverless platforms re-run this module per cold
// start and would otherwise open a new pool on every invocation until Atlas
// starts refusing connections.
let connectionPromise = null;

const connectDB = async () => {
    // 1 = connected, 2 = connecting
    if (mongoose.connection.readyState === 1) return mongoose.connection;
    if (connectionPromise) return connectionPromise;

    mongoose.connection.on('connected', () => console.log('Database connected'));
    mongoose.connection.on('error', (error) => console.error('Database error:', error.message));

    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not set — add it to your server environment.');
    }

    connectionPromise = mongoose
        .connect(`${process.env.MONGODB_URI}/SkinAffairs`)
        .catch((error) => {
            // Clear the cache so the next request can retry instead of being
            // stuck with a permanently rejected promise.
            connectionPromise = null;
            throw error;
        });

    return connectionPromise;
};

export default connectDB;
