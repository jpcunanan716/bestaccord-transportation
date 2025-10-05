import mongoose from "mongoose";

let gridfsBucket;

export const initGridFS = () => {
    const conn = mongoose.connection;

    conn.once('open', () => {
        gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
            bucketName: 'uploads'
        });
        console.log('✅ GridFS initialized');
    });
};

export const getGridFSBucket = () => {
    if (!gridfsBucket) {
        throw new Error('GridFS not initialized. Call initGridFS() first.');
    }
    return gridfsBucket;
};