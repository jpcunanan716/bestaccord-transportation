import express from 'express';
import Booking from '../models/Booking.js';
import TripReport from '../models/TripReport.js';
import Client from '../models/Client.js';
import Vehicle from '../models/Vehicle.js';
import Employee from '../models/Employee.js';

const router = express.Router();

// Get archived bookings
router.get('/bookings/archived', async (req, res) => {
    try {
        const archivedBookings = await Booking.find({ isArchived: true });
        res.json(archivedBookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add similar routes for other types...

// Restore item from archive
router.patch('/:type/:id/restore', async (req, res) => {
    try {
        const { type, id } = req.params;
        const Model = getModelByType(type);

        const item = await Model.findByIdAndUpdate(
            id,
            { isArchived: false },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json(item);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;