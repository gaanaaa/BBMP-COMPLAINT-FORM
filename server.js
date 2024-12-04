const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static("public"));

// Static folder to serve uploaded images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Set a unique filename based on timestamp
  },
});

const upload = multer({ storage });

// Route to handle form submission
app.post("/submit-complaint", upload.single("photo"), (req, res) => {
  const { name, contact, complaint, latitude, longitude } = req.body;

  // Validate required fields
  if (!name || !contact || !complaint || !latitude || !longitude || !req.file) {
    return res.status(400).json({ message: "All fields are required." });
  }

  // Log the received form data and uploaded file for debugging
  console.log("Received form data:", {
    name,
    contact,
    complaint,
    latitude,
    longitude,
  });
  console.log("Uploaded file:", req.file);

  // Create the complaint object
  const complaintsFile = path.join(__dirname, "complaints.json");
  const newComplaint = {
    id: Date.now(), // Unique complaint ID
    name,
    contact,
    complaint,
    location: {
      latitude,
      longitude,
    },
    photoUrl: `/uploads/${req.file.filename}`,
    submittedAt: new Date().toISOString(),
  };

  // Log the complaint data before saving
  console.log("Complaint Data:", newComplaint);

  // Read the existing complaints from the complaints.json file
  let complaints = [];
  if (fs.existsSync(complaintsFile)) {
    complaints = JSON.parse(fs.readFileSync(complaintsFile));
  }

  // Add the new complaint to the array
  complaints.push(newComplaint);

  try {
    // Write the updated complaints array to the file
    fs.writeFileSync(complaintsFile, JSON.stringify(complaints, null, 2));
    return res.status(200).json({
      message: "Complaint submitted successfully.",
      complaint: newComplaint,
    });
  } catch (err) {
    console.error("Error saving complaint to JSON:", err);
    return res
      .status(500)
      .json({ message: "An error occurred while saving the complaint." });
  }
});

// Route to fetch all complaints
app.get("/complaints", (req, res) => {
  const complaintsFile = path.join(__dirname, "complaints.json");

  if (!fs.existsSync(complaintsFile)) {
    return res.status(200).json([]);
  }

  const complaints = JSON.parse(fs.readFileSync(complaintsFile));
  return res.status(200).json(complaints);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
