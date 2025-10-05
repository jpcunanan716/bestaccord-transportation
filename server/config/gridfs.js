import mongoose from "mongoose";

let gridfsBucket;
let isInitialized = false;

export const initGridFS = () => {
    if (isInitialized) {
        console.log('GridFS already initialized');
        return;
    }

    const conn = mongoose.connection;

    // Check if connection is already open
    if (conn.readyState === 1) {
        gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
            bucketName: 'uploads'
        });
        isInitialized = true;
        console.log('✅ GridFS initialized immediately');
    } else {
        // Wait for connection to open
        conn.once('open', () => {
            gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
                bucketName: 'uploads'
            });
            isInitialized = true;
            console.log('✅ GridFS initialized on connection open');
        });
    }
};

export const getGridFSBucket = () => {
    if (!gridfsBucket || !isInitialized) {
        throw new Error('GridFS not initialized. Call initGridFS() first.');
    }
    return gridfsBucket;
};