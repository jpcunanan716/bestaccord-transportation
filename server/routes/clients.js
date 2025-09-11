import express from "express";
import Client from "../models/Client.js";

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

// ADD THIS ROUTE - and place it BEFORE the /:id route
router.get("/names", async (req, res) => {
  try {
    const clients = await Client.find({}, "clientName"); // only return clientName field
    res.json(clients);
  } catch (err) {
    console.error("Error fetching client names:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET single client - KEEP THIS AFTER the /names route
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
