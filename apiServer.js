const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB setup
const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://flightadmin:flight1234@cluster1.jvsbdru.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1";
const client = new MongoClient(uri);

let userCollection;
let bookingCollection;

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    const db = client.db("flightbooking");
    userCollection = db.collection("users");
    bookingCollection = db.collection("bookings");
    console.log(" Connected to MongoDB Atlas");
  } catch (err) {
    console.error(" MongoDB connection failed:", err);
  }
}
connectDB();

// Root route
app.get("/", (req, res) => {
  res.send("<h3>Flight Booking Server is running</h3>");
});

// Register User
app.post("/registerUser", async (req, res) => {
  const user = req.body;
  console.log(`[POST] Registering user: ${user.email}`);
  try {
    const result = await userCollection.insertOne(user);
    console.log(` User registered: ${user.email}`);
    res.status(200).send(result);
  } catch (err) {
    console.error(" Error registering user:", err);
    res.status(500).json({ message: "Registration failed", error: err });
  }
});

// Verify User Login
app.post("/verifyUser", async (req, res) => {
  const { email, password } = req.body;
  console.log(`[POST] Login attempt for: ${email}`);
  try {
    const user = await userCollection.findOne({ email, password });
    if (user) {
      console.log(` Login successful: ${email}`);
      res.status(200).send([user]);
    } else {
      console.log(` Login failed: ${email}`);
      res.status(200).send([]);
    }
  } catch (err) {
    console.error(" Login error:", err);
    res.status(500).json({ message: "Login failed", error: err });
  }
});

// Check if email exists
app.get("/checkEmail", async (req, res) => {
  const email = req.query.email;
  console.log(`[GET] Checking if email exists: ${email}`);
  try {
    const existing = await userCollection.findOne({ email });
    res.status(200).send({ exists: !!existing });
  } catch (err) {
    console.error(" Email check failed:", err);
    res.status(500).json({ message: "Email check failed", error: err });
  }
});

// Post a flight booking
app.post("/postBookingData", async (req, res) => {
  const booking = req.body;
  console.log("POST request received : " + JSON.stringify(req.body) + "\n");
  try {
    const result = await bookingCollection.insertOne(booking);
    console.log(
      "Order record with ID " + result.insertedId + " have been inserted\n"
    );
    res.status(200).send(result);
  } catch (err) {
    console.error(" Booking insertion failed:", err);
    res.status(500).json({ message: "Booking failed", error: err });
  }
});

// Get all bookings by user email
app.get("/getUserBookings", async (req, res) => {
  const email = req.query.email;
  console.log(`[GET] Fetching bookings for user: ${email}`);
  try {
    const bookings = await bookingCollection
      .find({ customerEmail: email })
      .toArray();
    console.log(bookings.length + " bookings retrieved for user: " + email);
    res.status(200).send(bookings);
  } catch (err) {
    console.error(" Fetching bookings failed:", err);
    res.status(500).json({ message: "Fetch failed", error: err });
  }
});

// Delete all bookings for a user
app.delete("/deleteUserBookings", async (req, res) => {
  const { email } = req.body;
  console.log(`[DELETE] Deleting bookings for user: ${email}`);
  try {
    const result = await bookingCollection.deleteMany({ customerEmail: email });
    console.log(result.deletedCount + " bookings deleted for user: " + email);
    res.status(200).send({ count: result.deletedCount });
  } catch (err) {
    console.error(" Booking deletion failed:", err);
    res.status(500).json({ message: "Deletion failed", error: err });
  }
});

// Delete a single booking by booking number
app.delete("/deleteBooking", async (req, res) => {
  const bookingNo = req.body.bookingNo?.toString(); // force to string
  console.log(`[DELETE] Attempting to delete bookingNo: "${bookingNo}"`);

  try {
    const result = await bookingCollection.deleteOne({ bookingNo });

    if (result.deletedCount > 0) {
      console.log(`Deleted booking ${bookingNo}`);
      res.status(200).send({ message: `Booking ${bookingNo} deleted.` });
    } else {
      console.log(`Booking ${bookingNo} not found`);
      res.status(404).send({ message: `Booking ${bookingNo} not found.` });
    }
  } catch (err) {
    console.error("Booking deletion failed:", err);
    res.status(500).json({ message: "Deletion failed", error: err });
  }
});

// Search for a booking by booking number
app.get("/searchBooking", async (req, res) => {
  const bookingNo = req.query.bookingNo;
  console.log(`[GET] Searching bookingNo: ${bookingNo}`);

  try {
    const result = await bookingCollection.findOne({
      $or: [{ bookingNo: parseInt(bookingNo) }, { bookingNo: bookingNo }],
    });

    if (result) {
      console.log(" Booking found: ", result);
      res.status(200).send(result);
    } else {
      console.log(" No booking found with this number");
      res.status(200).send({});
    }
  } catch (err) {
    console.error(" Error during search:", err);
    res.status(500).json({ message: "Search failed", error: err });
  }
});

// Start server
app.listen(port, () => {
  console.log(` Flight Booking Server running at http://localhost:${port}`);
});
