import express from "express";
import multer from "multer";
import fs from "fs";
import TripReport from "../models/TripReport.js";

const router = express.Router();

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads/trip-reports';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
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
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, Excel, JPG, PNG files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
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

// GET all trip reports
router.get("/", async (req, res) => {
    try {
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

        // Get total count for pagination
        const total = await TripReport.countDocuments(query);

        // Get paginated results
        const tripReports = await TripReport.find(query)
            .populate('bookingId', 'tripNumber reservationId companyName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

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
        res.status(500).json({ message: err.message });
    }
});

// GET single trip report
router.get("/:id", async (req, res) => {
    try {
        const tripReport = await TripReport.findById(req.params.id)
            .populate('bookingId', 'tripNumber reservationId companyName');

        if (!tripReport) {
            return res.status(404).json({ message: "Trip report not found" });
        }

        res.json(tripReport);
    } catch (err) {
        console.error("Error fetching trip report:", err);
        res.status(500).json({ message: err.message });
    }
});

// POST upload new trip report
router.post("/", upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const { receiptNumber, notes, bookingId, tripNumber, reservationId } = req.body;

        if (!receiptNumber) {
            return res.status(400).json({ message: "Receipt number is required" });
        }

        // Check if receipt number already exists
        const existingReport = await TripReport.findOne({ receiptNumber });
        if (existingReport) {
            // Delete uploaded file if receipt number already exists
            fs.unlinkSync(req.file.path);
            return res.status(409).json({ message: "Receipt number already exists" });
        }

        const documentType = getDocumentType(req.file.mimetype);

        const newTripReport = new TripReport({
            receiptNumber,
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
            notes: notes || ''
        });

        const savedReport = await newTripReport.save();
        await savedReport.populate('bookingId', 'tripNumber reservationId companyName');

        res.status(201).json({
            message: "Trip report uploaded successfully",
            tripReport: savedReport
        });

    } catch (err) {
        // Delete uploaded file if database save fails
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        console.error("Error uploading trip report:", err);

        if (err.code === 11000) {
            return res.status(409).json({ message: "Receipt number already exists" });
        }

        res.status(500).json({ message: err.message });
    }
});

// PUT update trip report
router.put("/:id", async (req, res) => {
    try {
        const { receiptNumber, notes, uploadedBy } = req.body;

        const updatedReport = await TripReport.findByIdAndUpdate(
            req.params.id,
            {
                receiptNumber,
                notes,
                uploadedBy,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        ).populate('bookingId', 'tripNumber reservationId companyName');

        if (!updatedReport) {
            return res.status(404).json({ message: "Trip report not found" });
        }

        res.json({
            message: "Trip report updated successfully",
            tripReport: updatedReport
        });

    } catch (err) {
        console.error("Error updating trip report:", err);

        if (err.code === 11000) {
            return res.status(409).json({ message: "Receipt number already exists" });
        }

        res.status(500).json({ message: err.message });
    }
});

// PATCH archive trip report
router.patch("/:id/archive", async (req, res) => {
    try {
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
                success: false,
                message: "Trip report not found"
            });
        }

        res.json({
            message: "Trip report archived successfully",
            tripReport
        });

    } catch (err) {
        console.error("Error archiving trip report:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

// PATCH restore trip report
router.patch("/:id/restore", async (req, res) => {
    try {
        const tripReport = await TripReport.findByIdAndUpdate(
            req.params.id,
            {
                isArchived: false,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!tripReport) {
            return res.status(404).json({ message: "Trip report not found" });
        }

        res.json({
            message: "Trip report restored successfully",
            tripReport
        });

    } catch (err) {
        console.error("Error restoring trip report:", err);
        res.status(500).json({ message: err.message });
    }
});

// DELETE trip report (also delete file)
router.delete("/:id", async (req, res) => {
    try {
        const tripReport = await TripReport.findById(req.params.id);

        if (!tripReport) {
            return res.status(404).json({ message: "Trip report not found" });
        }

        // Delete file from filesystem
        if (fs.existsSync(tripReport.filePath)) {
            fs.unlinkSync(tripReport.filePath);
        }

        // Delete from database
        await TripReport.findByIdAndDelete(req.params.id);

        res.json({ message: "Trip report deleted successfully" });

    } catch (err) {
        console.error("Error deleting trip report:", err);
        res.status(500).json({ message: err.message });
    }
});

// GET download file
router.get("/download/:id", async (req, res) => {
    try {
        const tripReport = await TripReport.findById(req.params.id);

        if (!tripReport) {
            return res.status(404).json({ message: "Trip report not found" });
        }

        if (!fs.existsSync(tripReport.filePath)) {
            return res.status(404).json({ message: "File not found on server" });
        }

        res.setHeader('Content-Type', tripReport.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${tripReport.originalFileName}"`);

        const fileStream = fs.createReadStream(tripReport.filePath);
        fileStream.pipe(res);

    } catch (err) {
        console.error("Error downloading trip report:", err);
        res.status(500).json({ message: err.message });
    }
});

// GET view/preview file (for PDF, images)
router.get("/view/:id", async (req, res) => {
    try {
        const tripReport = await TripReport.findById(req.params.id);

        if (!tripReport) {
            return res.status(404).json({ message: "Trip report not found" });
        }

        if (!fs.existsSync(tripReport.filePath)) {
            return res.status(404).json({ message: "File not found on server" });
        }

        res.setHeader('Content-Type', tripReport.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${tripReport.originalFileName}"`);

        const fileStream = fs.createReadStream(tripReport.filePath);
        fileStream.pipe(res);

    } catch (err) {
        console.error("Error viewing trip report:", err);
        res.status(500).json({ message: err.message });
    }
});

// GET statistics
router.get("/stats/overview", async (req, res) => {
    try {
        const stats = await Promise.all([
            TripReport.countDocuments({ isArchived: false }),
            TripReport.countDocuments({ isArchived: false, documentType: 'PDF' }),
            TripReport.countDocuments({ isArchived: false, documentType: { $in: ['JPG', 'JPEG', 'PNG'] } }),
            TripReport.countDocuments({ isArchived: false, documentType: { $in: ['DOC', 'DOCX'] } }),
            TripReport.countDocuments({ isArchived: true })
        ]);

        res.json({
            total: stats[0],
            pdf: stats[1],
            images: stats[2],
            documents: stats[3],
            archived: stats[4]
        });

    } catch (err) {
        console.error("Error fetching trip report stats:", err);
        res.status(500).json({ message: err.message });
    }
});

export default router;