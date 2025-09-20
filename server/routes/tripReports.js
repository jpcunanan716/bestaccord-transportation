// server/routes/tripReports.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import TripReport from "../models/TripReport.js";

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads/trip-reports';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`Created uploads directory: ${uploadsDir}`);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFileName = `${timestamp}_${originalName}`;
        cb(null, uniqueFileName);
    }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
    console.log('File filter - File details:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
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
    },
    onError: function (err, next) {
        console.error('Multer error:', err);
        next(err);
    }
});

// Helper function to determine document type from mime type
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

// Enhanced error handler middleware
const handleErrors = (err, req, res, next) => {
    console.error('Route error:', err);
    
    // Multer errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                message: 'File too large. Maximum file size is 20MB.',
                error: 'FILE_TOO_LARGE'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ 
                message: 'Unexpected file field. Please use "document" field name.',
                error: 'UNEXPECTED_FILE'
            });
        }
    }

    // File filter errors
    if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({ 
            message: err.message,
            error: 'INVALID_FILE_TYPE'
        });
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
        return res.status(409).json({ 
            message: 'Receipt number already exists. Please use a different receipt number.',
            error: 'DUPLICATE_RECEIPT'
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            message: 'Validation failed: ' + Object.values(err.errors).map(e => e.message).join(', '),
            error: 'VALIDATION_ERROR'
        });
    }

    // Default error
    res.status(500).json({ 
        message: err.message || 'An unexpected error occurred.',
        error: 'INTERNAL_SERVER_ERROR'
    });
};

// GET all trip reports
router.get("/", async (req, res) => {
    try {
        console.log('GET /trip-reports - Query params:', req.query);
        
        const { page = 1, limit = 10, documentType, uploadedBy, search } = req.query;
        const skip = (page - 1) * limit;

        // Build query
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
                { fileName: { $regex: search, $options: 'i' } },
                { originalFileName: { $regex: search, $options: 'i' } },
                { tripNumber: { $regex: search, $options: 'i' } },
                { reservationId: { $regex: search, $options: 'i' } }
            ];
        }

        console.log('Query:', query);

        // Get total count for pagination
        const total = await TripReport.countDocuments(query);

        // Get paginated results
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

// GET single trip report
router.get("/:id", async (req, res) => {
    try {
        console.log(`GET /trip-reports/${req.params.id}`);
        
        const tripReport = await TripReport.findById(req.params.id)
            .populate('bookingId', 'tripNumber reservationId companyName');
        
        if (!tripReport) {
            return res.status(404).json({ 
                message: "Trip report not found",
                error: 'NOT_FOUND'
            });
        }

        res.json(tripReport);
    } catch (err) {
        console.error("Error fetching trip report:", err);
        res.status(500).json({ 
            message: `Failed to fetch trip report: ${err.message}`,
            error: 'FETCH_ERROR'
        });
    }
});

// POST upload new trip report
router.post("/", (req, res) => {
    console.log('POST /trip-reports - Starting upload process');
    console.log('Request headers:', req.headers);
    
    upload.single('document')(req, res, async (err) => {
        try {
            console.log('Upload middleware executed');
            
            // Handle multer errors
            if (err) {
                console.error('Multer error:', err);
                
                // Clean up any uploaded file
                if (req.file && fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                    console.log('Cleaned up uploaded file due to error');
                }
                
                return handleErrors(err, req, res, null);
            }

            console.log('File upload details:', req.file ? {
                originalname: req.file.originalname,
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            } : 'No file uploaded');
            
            console.log('Request body:', req.body);

            // Validate file upload
            if (!req.file) {
                return res.status(400).json({ 
                    message: "No file uploaded. Please select a document to upload.",
                    error: 'NO_FILE'
                });
            }

            const { receiptNumber, notes, bookingId, tripNumber, reservationId } = req.body;

            // Validate required fields
            if (!receiptNumber || !receiptNumber.trim()) {
                // Clean up uploaded file
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                }
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
                // Delete uploaded file if receipt number already exists
                if (fs.existsSync(req.file.path)) {
                    fs.unlinkSync(req.file.path);
                    console.log('Cleaned up duplicate file');
                }
                return res.status(409).json({ 
                    message: "A document with this receipt number already exists. Please use a different receipt number.",
                    error: 'DUPLICATE_RECEIPT'
                });
            }

            const documentType = getDocumentType(req.file.mimetype);
            console.log('Determined document type:', documentType);

            // Create new trip report
            const newTripReport = new TripReport({
                receiptNumber: receiptNumber.trim(),
                documentType,
                fileName: req.file.filename,
                originalFileName: req.file.originalname,
                filePath: req.file.path,
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

            // Populate the booking details
            await savedReport.populate('bookingId', 'tripNumber reservationId companyName');

            res.status(201).json({
                message: "Trip report uploaded successfully",
                tripReport: savedReport,
                success: true
            });

        } catch (err) {
            console.error("Error in upload handler:", err);
            
            // Delete uploaded file if database save fails
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
                console.log('Cleaned up file due to database error');
            }

            // Handle specific errors
            if (err.code === 11000) {
                return res.status(409).json({ 
                    message: "Receipt number already exists. Please use a different receipt number.",
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
});

// PUT update trip report
router.put("/:id", async (req, res) => {
    try {
        console.log(`PUT /trip-reports/${req.params.id}`, req.body);
        
        const { receiptNumber, notes, uploadedBy } = req.body;
        
        if (!receiptNumber || !receiptNumber.trim()) {
            return res.status(400).json({ 
                message: "Receipt number is required and cannot be empty.",
                error: 'MISSING_RECEIPT_NUMBER'
            });
        }
        
        const updatedReport = await TripReport.findByIdAndUpdate(
            req.params.id,
            { 
                receiptNumber: receiptNumber.trim(),
                notes: notes ? notes.trim() : '',
                uploadedBy,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        ).populate('bookingId', 'tripNumber reservationId companyName');

        if (!updatedReport) {
            return res.status(404).json({ 
                message: "Trip report not found",
                error: 'NOT_FOUND'
            });
        }

        res.json({
            message: "Trip report updated successfully",
            tripReport: updatedReport,
            success: true
        });

    } catch (err) {
        console.error("Error updating trip report:", err);
        
        if (err.code === 11000) {
            return res.status(409).json({ 
                message: "Receipt number already exists. Please use a different receipt number.",
                error: 'DUPLICATE_RECEIPT'
            });
        }

        res.status(500).json({ 
            message: `Update failed: ${err.message}`,
            error: 'UPDATE_FAILED'
        });
    }
});

// PATCH archive trip report
router.patch("/:id/archive", async (req, res) => {
    try {
        console.log(`PATCH /trip-reports/${req.params.id}/archive`);
        
        const tripReport = await TripReport.findByIdAndUpdate(
            req.params.id,
            { 
                isArchived: true,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!tripReport) {
            return res.status(404).json({ 
                message: "Trip report not found",
                error: 'NOT_FOUND'
            });
        }

        res.json({
            message: "Trip report archived successfully",
            tripReport,
            success: true
        });

    } catch (err) {
        console.error("Error archiving trip report:", err);
        res.status(500).json({ 
            message: `Archive failed: ${err.message}`,
            error: 'ARCHIVE_FAILED'
        });
    }
});

// PATCH restore trip report
router.patch("/:id/restore", async (req, res) => {
    try {
        console.log(`PATCH /trip-reports/${req.params.id}/restore`);
        
        const tripReport = await TripReport.findByIdAndUpdate(
            req.params.id,
            { 
                isArchived: false,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!tripReport) {
            return res.status(404).json({ 
                message: "Trip report not found",
                error: 'NOT_FOUND'
            });
        }

        res.json({
            message: "Trip report restored successfully",
            tripReport,
            success: true
        });

    } catch (err) {
        console.error("Error restoring trip report:", err);
        res.status(500).json({ 
            message: `Restore failed: ${err.message}`,
            error: 'RESTORE_FAILED'
        });
    }
});

// DELETE trip report (also delete file)
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

        // Delete file from filesystem
        if (tripReport.filePath && fs.existsSync(tripReport.filePath)) {
            fs.unlinkSync(tripReport.filePath);
            console.log('Deleted file:', tripReport.filePath);
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

        if (!fs.existsSync(tripReport.filePath)) {
            return res.status(404).json({ 
                message: "File not found on server. The file may have been moved or deleted.",
                error: 'FILE_NOT_FOUND'
            });
        }

        res.setHeader('Content-Type', tripReport.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${tripReport.originalFileName}"`);
        
        const fileStream = fs.createReadStream(tripReport.filePath);
        fileStream.pipe(res);

    } catch (err) {
        console.error("Error downloading trip report:", err);
        res.status(500).json({ 
            message: `Download failed: ${err.message}`,
            error: 'DOWNLOAD_FAILED'
        });
    }
});

// GET view/preview file (for PDF, images)
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

        if (!fs.existsSync(tripReport.filePath)) {
            return res.status(404).json({ 
                message: "File not found on server. The file may have been moved or deleted.",
                error: 'FILE_NOT_FOUND'
            });
        }

        res.setHeader('Content-Type', tripReport.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${tripReport.originalFileName}"`);
        
        const fileStream = fs.createReadStream(tripReport.filePath);
        fileStream.pipe(res);

    } catch (err) {
        console.error("Error viewing trip report:", err);
        res.status(500).json({ 
            message: `View failed: ${err.message}`,
            error: 'VIEW_FAILED'
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

        console.log('Statistics:', result);

        res.json(result);

    } catch (err) {
        console.error("Error fetching trip report stats:", err);
        res.status(500).json({ 
            message: `Failed to fetch statistics: ${err.message}`,
            error: 'STATS_FAILED'
        });
    }
});

// Health check endpoint
router.get("/health", (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Trip reports API is running',
        timestamp: new Date().toISOString(),
        uploadsDir: uploadsDir,
        uploadsDirExists: fs.existsSync(uploadsDir)
    });
});

// Apply error handling middleware
router.use(handleErrors);

export default router;