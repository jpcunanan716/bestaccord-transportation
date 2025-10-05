import express from "express";
import multer from "multer";
import TripReport from "../models/TripReport.js";
import { Readable } from "stream";
import { getGridFSBucket } from "../config/gridfs.js";

const router = express.Router();

// Configure multer with memory storage
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    console.log('File filter - File details:', {
        originalname: file.originalname,
        mimetype: file.mimetype
    });

    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        console.log('File type accepted:', file.mimetype);
        cb(null, true);
    } else {
        console.log('File type rejected:', file.mimetype);
        cb(new Error(`Invalid file type: ${file.mimetype}. Only PDF, DOC, DOCX, Excel, JPG, PNG files are allowed.`), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    }
});

// Helper function to determine document type
const getDocumentType = (mimeType) => {
    const typeMap = {
        'application/pdf': 'PDF',
        'application/msword': 'DOC',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
        'application/vnd.ms-excel': 'Excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
        'image/jpeg': 'JPEG',
        'image/jpg': 'JPG',
        'image/png': 'PNG',
        'text/plain': 'TXT'
    };
    return typeMap[mimeType] || 'Other';
};

// GET all trip reports
router.get("/", async (req, res) => {
    try {
        console.log('GET /trip-reports - Query params:', req.query);

        const { page = 1, limit = 10, documentType, uploadedBy, search } = req.query;
        const skip = (page - 1) * limit;

        let query = { isArchived: false };

        if (documentType && documentType !== 'All') {
            query.documentType = documentType;
        }

        if (uploadedBy && uploadedBy !== 'All') {
            query.uploadedBy = uploadedBy;
        }

        if (search) {
            query.$or = [
                { receiptNumber: { $regex: search, $options: 'i' } },
                { originalFileName: { $regex: search, $options: 'i' } },
                { tripNumber: { $regex: search, $options: 'i' } },
                { reservationId: { $regex: search, $options: 'i' } },
                { notes: { $regex: search, $options: 'i' } }
            ];
        }

        const total = await TripReport.countDocuments(query);

        const tripReports = await TripReport.find(query)
            .populate('bookingId', 'tripNumber reservationId companyName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        console.log(`Found ${tripReports.length} trip reports out of ${total} total`);

        res.json({
            tripReports,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit),
                hasNext: skip + tripReports.length < total,
                hasPrev: page > 1
            }
        });
    } catch (err) {
        console.error("Error fetching trip reports:", err);
        res.status(500).json({
            message: `Failed to fetch trip reports: ${err.message}`,
            error: 'FETCH_ERROR'
        });
    }
});

// POST upload new trip report
router.post("/", upload.single('document'), async (req, res) => {
    let uploadStreamId = null;

    try {
        console.log('POST /trip-reports - Starting upload process');

        if (!req.file) {
            return res.status(400).json({
                message: "No file uploaded. Please select a document to upload.",
                error: 'NO_FILE'
            });
        }

        console.log('File upload details:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        const { receiptNumber, notes, bookingId, tripNumber, reservationId } = req.body;

        if (!receiptNumber || !receiptNumber.trim()) {
            return res.status(400).json({
                message: "Receipt number is required and cannot be empty.",
                error: 'MISSING_RECEIPT_NUMBER'
            });
        }

        // Check if receipt number already exists
        const existingReport = await TripReport.findOne({
            receiptNumber: receiptNumber.trim(),
            isArchived: false
        });

        if (existingReport) {
            return res.status(409).json({
                message: "A document with this receipt number already exists. Please use a different receipt number.",
                error: 'DUPLICATE_RECEIPT'
            });
        }

        // Get GridFS bucket
        const gridfsBucket = getGridFSBucket();

        // Create readable stream from buffer
        const readableStream = new Readable();
        readableStream.push(req.file.buffer);
        readableStream.push(null);

        // Generate unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}_${req.file.originalname}`;

        // Upload to GridFS
        const uploadStream = gridfsBucket.openUploadStream(filename, {
            metadata: {
                originalName: req.file.originalname,
                uploadedBy: req.body.uploadedBy || 'Admin',
                mimeType: req.file.mimetype
            }
        });

        uploadStreamId = uploadStream.id;

        // Pipe file to GridFS
        readableStream.pipe(uploadStream);

        // Wait for upload to complete
        await new Promise((resolve, reject) => {
            uploadStream.on('finish', resolve);
            uploadStream.on('error', reject);
        });

        const documentType = getDocumentType(req.file.mimetype);

        // Create new trip report
        const newTripReport = new TripReport({
            receiptNumber: receiptNumber.trim(),
            documentType,
            gridfsFileId: uploadStreamId,
            originalFileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            bookingId: bookingId || null,
            tripNumber: tripNumber || null,
            reservationId: reservationId || null,
            uploadedBy: req.body.uploadedBy || 'Admin',
            notes: notes ? notes.trim() : ''
        });

        console.log('Saving trip report to database...');
        const savedReport = await newTripReport.save();
        console.log('Trip report saved successfully:', savedReport._id);

        await savedReport.populate('bookingId', 'tripNumber reservationId companyName');

        res.status(201).json({
            message: "Trip report uploaded successfully",
            tripReport: savedReport,
            success: true
        });

    } catch (err) {
        console.error("Error uploading trip report:", err);

        // Delete file from GridFS if save failed
        if (uploadStreamId) {
            try {
                const gridfsBucket = getGridFSBucket();
                await gridfsBucket.delete(uploadStreamId);
                console.log('Cleaned up GridFS file due to error');
            } catch (deleteErr) {
                console.error('Error cleaning up GridFS file:', deleteErr);
            }
        }

        if (err.code === 11000) {
            return res.status(409).json({
                message: "Receipt number already exists",
                error: 'DUPLICATE_RECEIPT'
            });
        }

        if (err.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Validation failed: ' + Object.values(err.errors).map(e => e.message).join(', '),
                error: 'VALIDATION_ERROR'
            });
        }

        res.status(500).json({
            message: `Upload failed: ${err.message}`,
            error: 'UPLOAD_FAILED'
        });
    }
});

// GET view/preview file
router.get("/view/:id", async (req, res) => {
    try {
        console.log(`GET /trip-reports/view/${req.params.id}`);

        const tripReport = await TripReport.findById(req.params.id);

        if (!tripReport) {
            return res.status(404).json({
                message: "Trip report not found",
                error: 'NOT_FOUND'
            });
        }

        const gridfsBucket = getGridFSBucket();

        // Check if file exists in GridFS
        const files = await gridfsBucket.find({ _id: tripReport.gridfsFileId }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({
                message: "File not found in database",
                error: 'FILE_NOT_FOUND'
            });
        }

        res.setHeader('Content-Type', tripReport.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${tripReport.originalFileName}"`);

        const downloadStream = gridfsBucket.openDownloadStream(tripReport.gridfsFileId);
        downloadStream.pipe(res);

    } catch (err) {
        console.error("Error viewing trip report:", err);
        res.status(500).json({
            message: `View failed: ${err.message}`,
            error: 'VIEW_FAILED'
        });
    }
});

// GET download file
router.get("/download/:id", async (req, res) => {
    try {
        console.log(`GET /trip-reports/download/${req.params.id}`);

        const tripReport = await TripReport.findById(req.params.id);

        if (!tripReport) {
            return res.status(404).json({
                message: "Trip report not found",
                error: 'NOT_FOUND'
            });
        }

        const gridfsBucket = getGridFSBucket();

        const files = await gridfsBucket.find({ _id: tripReport.gridfsFileId }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({
                message: "File not found in database",
                error: 'FILE_NOT_FOUND'
            });
        }

        res.setHeader('Content-Type', tripReport.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${tripReport.originalFileName}"`);

        const downloadStream = gridfsBucket.openDownloadStream(tripReport.gridfsFileId);
        downloadStream.pipe(res);

    } catch (err) {
        console.error("Error downloading trip report:", err);
        res.status(500).json({
            message: `Download failed: ${err.message}`,
            error: 'DOWNLOAD_FAILED'
        });
    }
});

// PATCH archive trip report
router.patch("/:id/archive", async (req, res) => {
    try {
        console.log(`PATCH /trip-reports/${req.params.id}/archive`);

        const tripReport = await TripReport.findByIdAndUpdate(
            req.params.id,
            { isArchived: true, updatedAt: new Date() },
            { new: true }
        );

        if (!tripReport) {
            return res.status(404).json({ message: "Trip report not found" });
        }

        res.json({
            message: "Trip report archived successfully",
            tripReport,
            success: true
        });

    } catch (err) {
        console.error("Error archiving trip report:", err);
        res.status(500).json({ message: err.message });
    }
});

// DELETE trip report (delete from GridFS and database)
router.delete("/:id", async (req, res) => {
    try {
        console.log(`DELETE /trip-reports/${req.params.id}`);

        const tripReport = await TripReport.findById(req.params.id);

        if (!tripReport) {
            return res.status(404).json({
                message: "Trip report not found",
                error: 'NOT_FOUND'
            });
        }

        const gridfsBucket = getGridFSBucket();

        // Delete file from GridFS
        try {
            await gridfsBucket.delete(tripReport.gridfsFileId);
            console.log('Deleted file from GridFS');
        } catch (gridfsErr) {
            console.warn('GridFS deletion warning:', gridfsErr.message);
            // Continue with database deletion even if GridFS file doesn't exist
        }

        // Delete from database
        await TripReport.findByIdAndDelete(req.params.id);

        res.json({
            message: "Trip report deleted successfully",
            success: true
        });

    } catch (err) {
        console.error("Error deleting trip report:", err);
        res.status(500).json({
            message: `Delete failed: ${err.message}`,
            error: 'DELETE_FAILED'
        });
    }
});

// GET statistics
router.get("/stats/overview", async (req, res) => {
    try {
        console.log('GET /trip-reports/stats/overview');

        const stats = await Promise.all([
            TripReport.countDocuments({ isArchived: false }),
            TripReport.countDocuments({ isArchived: false, documentType: 'PDF' }),
            TripReport.countDocuments({ isArchived: false, documentType: { $in: ['JPG', 'JPEG', 'PNG'] } }),
            TripReport.countDocuments({ isArchived: false, documentType: { $in: ['DOC', 'DOCX'] } }),
            TripReport.countDocuments({ isArchived: true })
        ]);

        const result = {
            total: stats[0],
            pdf: stats[1],
            images: stats[2],
            documents: stats[3],
            archived: stats[4]
        };

        res.json(result);

    } catch (err) {
        console.error("Error fetching trip report stats:", err);
        res.status(500).json({
            message: `Failed to fetch statistics: ${err.message}`,
            error: 'STATS_FAILED'
        });
    }
});

export default router;