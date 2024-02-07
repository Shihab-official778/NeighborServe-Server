const express = require("express");
const router = express.Router();
const client = require("../database/db");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");
const cors = require("cors");
const app = express();

// Use CORS middleware
app.use(cors());

const usersCollection = client.db("NeighborServe").collection("UsersData");

router.get("/", async (req, res) => {
  const result = await usersCollection.find().limit(5).toArray();
  res.send(result);
});

router.get("/provider", async (req, res) => {
  const query = { user_type: "Service Provider" };
  const result = await usersCollection.find(query).limit(8).toArray();
  res.send(result);
});

router.get("/alluser", async (req, res) => {
  const query = { user_type: "User" };

  const result = await usersCollection.find(query).toArray();
  res.send(result);
});
router.get("/allprovider", async (req, res) => {
  // const query = { user_type: "Service Provider" };
  const query = { 
    admin_approval: 0 };

  const result = await usersCollection.find(query).toArray();
  res.send(result);
});




router.put("/approved/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await usersCollection.findOne(query);
  const x = result.user_verificationStatus2;
  console.log(x);
  const result2 = await usersCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: {admin_approval: 1 , user_verficationStatus: x}},
  { returnDocument: 'after' } 
  );
  // const result = await usersCollection.findOneAndUpdate(
  //   { _id: new ObjectId(id) },
  //   { $set: { admin_approval: 1 } },
  //   { returnDocument: 'after' } // Return the updated document
  // );
 
});

router.get("/view/:id", async (req, res) => {
  const id = req.params.id;
  const result = await usersCollection.findOne({ _id: new ObjectId(id) });
  res.send(result);
 
});










router.get("/provider/:type", async (req, res) => {
  const type = req.params.type;

  const query = { user_category: type };

  const result = await usersCollection.find(query).limit(12).toArray();
  res.send(result);
});
router.get("/provider/details/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await usersCollection.findOne(query);
  res.send(result);
});

// router.post("/signup", async (req, res) => {
//   const {
//     user_fullname,
//     user_email,
//     user_pass,
//     user_dob,
//     user_gender,
//     user_type,
//     user_status,
//     user_location,
//     user_lat,
//     user_lon,
//     user_phone,
//     user_regYear,
//   } = req.body

//   const query = { user_email }
//   const existingUser = await usersCollection.findOne(query)
//   if (existingUser) {
//     return res.send({ message: "user already exists" })
//   }
//   const hashedPassword = await bcrypt.hash(user_pass, 10)
//   const newUser = {
//     user_fullname,
//     user_email,
//     user_pass: hashedPassword,
//     user_dob,
//     user_gender,
//     user_type,
//     user_status,
//     user_location,
//     user_lat,
//     user_lon,
//     user_phone,
//     user_regYear,
//   }
//   const result = await usersCollection.insertOne(newUser)
//   res.send(result)
// })

router.post("/signup", async (req, res) => {
  const {
    user_fullname,
    user_email,
    user_pass,
    user_dob,
    user_gender,
    user_type,
    user_status,
    user_location,
    user_lat,
    user_lon,
    user_phone,
    user_regYear,
  } = req.body;

  const query = { user_email };
  const existingUser = await usersCollection.findOne(query);

  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(user_pass, 10);
  const newUser = {
    user_fullname,
    user_email,
    user_pass: hashedPassword,
    user_dob,
    user_gender,
    user_type,
    user_status,
    user_location,
    user_lat,
    user_lon,
    user_phone,
    user_regYear,
  };

  const result = await usersCollection.insertOne(newUser);

  // Get the inserted user from the database to include its _id in the response
  const insertedUser = await usersCollection.findOne({
    _id: result.insertedId,
  });

  // Return the relevant user information in the response
  res.status(201).json({
    insertedId: insertedUser._id,
    user_fullname: insertedUser.user_fullname,
    user_email: insertedUser.user_email,
    // Include other relevant user information as needed
  });
});

router.post("/providersignup", async (req, res) => {
  const {
    user_fullname,
    user_email,
    user_pass,
    user_dob,
    user_gender,
    user_type,
    user_category,
    user_status,
    user_location,
    user_lat,
    user_lon,
    user_phone,
    user_regYear,
    user_hireCount,
    user_verficationStatus,
    user_serviceDetails,
    user_respondTime,
  } = req.body;

  const query = { user_email };
  const existingUser = await usersCollection.findOne(query);
  if (existingUser) {
    return res.send({ message: "user already exists" });
  }
  const hashedPassword = await bcrypt.hash(user_pass, 10);
  const newUser = {
    user_fullname,
    user_email,
    user_pass: hashedPassword,
    user_dob,
    user_gender,
    user_type,
    user_category,
    user_status,
    user_location,
    user_lat,
    user_lon,
    user_phone,
    user_regYear,
    user_hireCount,
    user_verficationStatus,
    user_serviceDetails,
    user_respondTime,
  };
  const result = await usersCollection.insertOne(newUser);
  const insertedUser = await usersCollection.findOne({
    _id: result.insertedId,
  });

  // Return the relevant user information in the response
  res.status(201).json({
    insertedId: insertedUser._id,
    user_fullname: insertedUser.user_fullname,
    user_email: insertedUser.user_email,
    // Include other relevant user information as needed
  });
});

router.post("/users/googlelogin", async (req, res) => {
  const user = req.body;

  const query = { email: user.email };
  const existingUser = await usersCollection.findOne(query);

  if (existingUser) {
    return res.send({ message: "user already exists" });
  }

  const result = await usersCollection.insertOne(user);
  res.send(result);
});

router.get("/admin/:email", async (req, res) => {
  const email = req.params.email;
  const query = { user_email: email };
  const user = await usersCollection.findOne(query);
  const result = { admin: user?.user_type === "admin" };
  res.send(result);
});
router.get("/provider2/:email", async (req, res) => {
  const email = req.params.email;
  const query = { user_email: email, user_type: "Service Provider" };
  const user = await usersCollection.findOne(query);
  const result = { provider: !!user }; // Set to true if user is found, false if not
  res.json(result);
});

// Your API route (assuming it's part of a larger Express app)
router.get("/user/:email", async (req, res) => {
  try {
    const email = req.params.email;
    console.log(email);
    const query = { user_email: email, user_type: "User" };
    const user = await usersCollection.findOne(query);
    const result = { user: !!user };
    res.json(result);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/addFavoriteProvider", async (req, res) => {
  try {
    const { userEmail, providerId } = req.body;
    const email = { user_email: userEmail };
    // Find the user by ID and update the favoriteProviders array
    const updatedUser = await usersCollection.findOneAndUpdate(
      email,
      { $addToSet: { favoriteProviders: providerId } },
      { new: true }
    );
    console.log("irfan");
    res.send(updatedUser);
  } catch (error) {
    console.error("Error adding favorite provider:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/favProvider", async (req, res) => {
  const email = "irfan007@gmail.com";

  const userEmali = {
    user_email: email,
  };

  const result = await usersCollection.findOne(userEmali);
  res.send(result);
});

router.get("/search", async (req, res) => {
  const searchQuery = req.query.q;
  const query1 = {
    $or: [
      { user_name: { $regex: searchQuery, $options: 'i' } },
      { user_fullname: { $regex: searchQuery, $options: 'i' } },
      { user_type: { $regex: searchQuery, $options: 'i' } },
      { user_category: { $regex: searchQuery, $options: 'i' } },
    ],
  };
  // const query1 = { user_name: { $regex: query, $options: 'i' } };
  const result = await usersCollection.find(query1).toArray();

  
  res.json(result);
});

module.exports = router;
