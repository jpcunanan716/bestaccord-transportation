// server/models/TripReport.js
import mongoose from "mongoose";

const tripReportSchema = new mongoose.Schema({
    receiptNumber: { 
        type: String, 
        required: true,
        unique: true
    },
    documentType: { 
        type: String, 
        required: true,
        enum: ['PDF', 'DOC', 'DOCX', 'JPG', 'JPEG', 'PNG', 'Excel', 'Other'],
        default: 'PDF'
    },
    fileName: { 
        type: String, 
        required: true 
    },
    originalFileName: { 
        type: String, 
        required: true 
    },
    filePath: { 
        type: String, 
        required: true 
    },
    fileSize: { 
        type: Number, 
        required: true 
    },
    mimeType: { 
        type: String, 
        required: true 
    },
    bookingId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Booking',
        required: false
    },
    tripNumber: { 
        type: String, 
        required: false 
    },
    reservationId: { 
        type: String, 
        required: false 
    },
    uploadedBy: { 
        type: String, 
        required: true,
        default: 'Admin'
    },
    notes: { 
        type: String, 
        required: false 
    },
    isArchived: { 
        type: Boolean, 
        default: false 
    },
}, { 
    timestamps: true 
});

// Index for faster queries
tripReportSchema.index({ receiptNumber: 1 });
tripReportSchema.index({ documentType: 1 });
tripReportSchema.index({ uploadedBy: 1 });
tripReportSchema.index({ createdAt: -1 });

export default mongoose.model("TripReport", tripReportSchema);