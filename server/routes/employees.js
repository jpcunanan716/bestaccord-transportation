import express from "express";
import Employee from "../models/Employee.js";
import Counter from "../models/Counter.js";

const router = express.Router();

// Generate next Employee ID
async function getNextEmployeeID() {
  try {
    const counter = await Counter.findOneAndUpdate(
      { id: "employee" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // If seq is somehow missing, set it to 1
    if (!counter.seq) {
      counter.seq = 1;
      await counter.save();
    }

    const seqNumber = counter.seq.toString().padStart(3, "0");
    return `EMP${seqNumber}`;
  } catch (error) {
    console.error("Error generating employee ID:", error);
    throw error;
  }
}

// GET all employees
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET single employee
router.get("/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (err) {
    console.error("Error fetching employee:", err);
    res.status(500).json({ message: err.message });
  }
});

// POST create employee
router.post("/", async (req, res) => {
  try {
    // Remove employeeId from request body if present (we'll generate it)
    const { employeeId, ...employeeData } = req.body;

    // Generate new employee ID
    const newEmployeeId = await getNextEmployeeID();

    if (!newEmployeeId) {
      return res.status(500).json({ message: "Failed to generate Employee ID" });
    }

    // Create new employee with generated ID
    const newEmployee = new Employee({
      ...employeeData,
      employeeId: newEmployeeId
    });

    const savedEmployee = await newEmployee.save();
    res.status(201).json(savedEmployee);
  } catch (err) {
    console.error("Error creating employee:", err);

    // If it's a duplicate key error, try to handle it gracefully
    if (err.code === 11000) {
      // Check if it's employeeId duplicate
      if (err.keyPattern && err.keyPattern.employeeId) {
        return res.status(400).json({
          message: "Employee ID generation conflict. Please try again."
        });
      }
      return res.status(400).json({
        message: "Duplicate entry detected"
      });
    }

    res.status(500).json({ message: err.message });
  }
});

// PUT update employee
router.put("/:id", async (req, res) => {
  try {
    // Don't allow updating employeeId through PUT request
    const { employeeId, ...updateData } = req.body;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(updatedEmployee);
  } catch (err) {
    console.error("Error updating employee:", err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE employee
router.delete("/:id", async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    if (!deletedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    console.error("Error deleting employee:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;