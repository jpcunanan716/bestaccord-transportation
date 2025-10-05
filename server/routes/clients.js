import express from "express";
import Client from "../models/Client.js";
import Booking from "../models/Booking.js";

const router = express.Router();

// GET all clients
router.get("/", async (req, res) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json(clients);
  } catch (err) {
    console.error("Error fetching clients:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET all client names (for dropdowns, etc.)
router.get("/names", async (req, res) => {
  try {
    const clients = await Client.find({}, "clientName"); // only return clientName field
    res.json(clients);
  } catch (err) {
    console.error("Error fetching client names:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET single client
router.get("/:id", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.json(client);
  } catch (err) {
    console.error("Error fetching client:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET bookings for a specific client
router.get("/:id/bookings", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });

    const bookings = await Booking.find({
      companyName: client.clientName,
      isArchived: false
    }).sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("Error fetching client history:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST create client
router.post("/", async (req, res) => {
  try {
    const newClient = new Client(req.body);
    const savedClient = await newClient.save();
    res.status(201).json(savedClient);
  } catch (err) {
    console.error("Error creating client:", err);
    res.status(500).json({ message: err.message });
  }
});

// PUT update client
router.put("/:id", async (req, res) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedClient) return res.status(404).json({ message: "Client not found" });
    res.json(updatedClient);
  } catch (err) {
    console.error("Error updating client:", err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH archive client
router.patch('/:id/archive', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      {
        isArchived: true,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found"
      });
    }

    res.json({
      success: true,
      message: "Client archived successfully",
      client
    });
  } catch (err) {
    console.error('Error archiving client:', err);
    res.status(500).json({
      success: false,
      message: "Error archiving client"
    });
  }
});

// PATCH restore client
router.patch('/:id/restore', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      {
        isArchived: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found"
      });
    }

    res.json({
      success: true,
      message: "Client restored successfully",
      client
    });
  } catch (err) {
    console.error('Error restoring client:', err);
    res.status(500).json({
      success: false,
      message: "Error restoring client"
    });
  }
});

// DELETE client
router.delete("/:id", async (req, res) => {
  try {
    const deletedClient = await Client.findByIdAndDelete(req.params.id);
    if (!deletedClient) return res.status(404).json({ message: "Client not found" });
    res.json({ message: "Client deleted successfully" });
  } catch (err) {
    console.error("Error deleting client:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
