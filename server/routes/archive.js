import express from 'express';
import Booking from '../models/Booking.js';
// import TripReport from '../models/TripReport.js';
import Client from '../models/Client.js';
import Vehicle from '../models/Vehicle.js';
import Employee from '../models/Employee.js';

const router = express.Router();

// Helper function to get the correct model - ADD THIS
function getModelByType(type) {
    switch (type) {
        case 'bookings':
            return Booking;
        case 'clients':
            return Client;
        case 'vehicles':
            return Vehicle;
        case 'employees':
            return Employee;
        // case 'tripReports':
        //     return TripReport;
        default:
            throw new Error(`Unknown model type: ${type}`);
    }
}

// Get archived bookings
router.get('/bookings/archived', async (req, res) => {
    try {
        const archivedBookings = await Booking.find({ isArchived: true });
        res.json(archivedBookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get archived clients
router.get('/clients/archived', async (req, res) => {
    try {
        const archivedClients = await Client.find({ isArchived: true });
        res.json(archivedClients);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get archived vehicles
router.get('/vehicles/archived', async (req, res) => {
    try {
        const archivedVehicles = await Vehicle.find({ isArchived: true });
        res.json(archivedVehicles);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get archived employees
router.get('/employees/archived', async (req, res) => {
    try {
        const archivedEmployees = await Employee.find({ isArchived: true });
        res.json(archivedEmployees);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Restore item from archive
router.patch('/:type/:id/restore', async (req, res) => {
    try {
        const { type, id } = req.params;
        const Model = getModelByType(type); // Now this function exists

        const item = await Model.findByIdAndUpdate(
            id,
            { isArchived: false },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json({ success: true, message: `${type} restored successfully`, item });
    } catch (err) {
        console.error('Error restoring item:', err);
        res.status(500).json({ message: err.message });
    }
});

export default router;