const express = require("express");
const axios = require("axios");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const client = require("../database/db");
const { ObjectId } = require("mongodb");

const usersCollection = client.db("NeighborServe").collection("UsersData");
// const ChatsCollection = client.db("NeighborServe").collection("Chats"); // Update with your actual database and collection names
// const msgCollection = client.db("NeighborServe").collection("Messages");

router.get("/api/:id/:category", async (req, res) => {
  const id = req.params.id;
  const category = req.params.category;
  const type = "Service Provider";
  const filter = { user_category: category, user_type: type };
  const result = await usersCollection.find(filter).toArray();
  const filter2 = { _id: new ObjectId(id) };
  const document = await usersCollection.find(filter2).toArray();
  const userLat = document[0].user_lat;
  const userLon = document[0].user_lon;

  function toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const lat1Rad = toRadians(lat1);
    const lon1Rad = toRadians(lon1);
    const lat2Rad = toRadians(lat2);
    const lon2Rad = toRadians(lon2);
    const dlon = lon2Rad - lon1Rad;
    const dlat = lat2Rad - lat1Rad;

    const a =
      Math.sin(dlat / 2) ** 2 +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dlon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  }

  const dataArrayUpdated = result
    .filter(place => place.user_rating !== undefined && place.user_reviews !== undefined)
    .map((place) => {
      const distance = haversine(
        userLat,
        userLon,
        place.user_lat,
        place.user_lon
      );
      return { ...place, distance };
    });

  dataArrayUpdated.sort((a, b) => a.distance - b.distance);

  const dataArrayUpdatedArray = [...dataArrayUpdated];
  console.log("results: " + dataArrayUpdated);
  const firstThreeElements = dataArrayUpdatedArray.slice(0, 3);

  res.send(firstThreeElements);
});


router.get("/api/v2/:id/:category", async (req, res) => {
  try {
    const id = req.params.id;
    const category = req.params.category;

    // Make a GET request using axios to the first API
    const response = await axios.get(
      `http://localhost:5000/providers/api/${id}/${category}`
    );

    // Perform sentiment analysis for each element in response.data
    const promises = response.data.map(async (item) => {
      const firstUserReviews = item.user_reviews;

      // Extract reviews
      const extractedReviews = {
        sentences: firstUserReviews.map((review) => ({ text: review.review })),
      };

      // Make a POST request to the sentiment analysis API
      const response2 = await axios.post("http://localhost:5001/predict", {
        sentences: extractedReviews.sentences,
      });

      // Access the positiveness value from the response of the second API call
      const positiveness = response2.data.overall_score;

      // Store the positiveness value inside the current item
      item.positiveness = positiveness;

      return item;
    });

    // Wait for all promises to resolve
    const updatedData = await Promise.all(promises);

    // Send the updated response to the client
    res.json(updatedData);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/providers/:id/:category", async (req, res) => {
  const id = req.params.id; // Use req.params.id to get the id from route parameters
  const category = req.params.category;
  const type = "Service Provider";
  const filter = { user_category: category, user_type: type };
  const result = await usersCollection.find(filter).toArray();
  const filter2 = { _id: new ObjectId(id) };
  const document = await usersCollection.find(filter2).toArray();
  const userLat = document[0].user_lat;
  const userLon = document[0].user_lon;

  // haversine algorithm to calculate distances between 2 coordinates
  function toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const lat1Rad = toRadians(lat1);
    const lon1Rad = toRadians(lon1);
    const lat2Rad = toRadians(lat2);
    const lon2Rad = toRadians(lon2);
    const dlon = lon2Rad - lon1Rad;
    const dlat = lat2Rad - lat1Rad;

    const a =
      Math.sin(dlat / 2) ** 2 +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dlon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    // console.log("distance: " + distance);
    return distance;
  }

  const dataArrayUpdated = result.map((place) => {
    const distance = haversine(
      userLat,
      userLon,
      place.user_lat,
      place.user_lon
    );
    return { ...place, distance };
  });

  // Sort the dataArrayWithDistances by distance in ascending order
  dataArrayUpdated.sort((a, b) => a.distance - b.distance);

  res.send(dataArrayUpdated);
});

router.get("/getDistance/:userId/:proId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const proId = req.params.proId;
    const filter = { _id: new ObjectId(userId) };
    const filter2 = { _id: new ObjectId(proId) };
    const userData = await usersCollection.find(filter).toArray();
    const proData = await usersCollection.find(filter2).toArray();
    const userLat = userData[0].user_lat;
    const userLon = userData[0].user_lon;
    const userLocation = userData[0].user_location;
    const proLat = proData[0].user_lat;
    const proLon = proData[0].user_lon;
    const proLocation = proData[0].user_location;
    const uimg = userData[0].user_img;
    const pimg = proData[0].user_img;

    function toRadians(degrees) {
      return degrees * (Math.PI / 180);
    }

    function haversine(lat1, lon1, lat2, lon2) {
      const R = 6371000; // Radius of the Earth in meters
      const lat1Rad = toRadians(lat1);
      const lon1Rad = toRadians(lon1);
      const lat2Rad = toRadians(lat2);
      const lon2Rad = toRadians(lon2);
      const dlon = lon2Rad - lon1Rad;
      const dlat = lat2Rad - lat1Rad;

      const a =
        Math.sin(dlat / 2) ** 2 +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dlon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      return distance;
    }

    const distanceInMeters = haversine(userLat, userLon, proLat, proLon);

    // Check for Nearby conditions
    let result = "";
    if (distanceInMeters === 0 || distanceInMeters <= 100 * 60) {
      result = "Nearby";
    } else {
      // Format the distance based on the value
      result =
        distanceInMeters < 1000
          ? `${Math.round(distanceInMeters)} meters`
          : `${(distanceInMeters / 1000).toFixed(2)} km`;
    }

    // Send the response as JSON
    res.json({
      distance: result,
      userLocation,
      proLocation,
      uimg,
      pimg,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/getId/:userEmail", async (req, res) => {
  const email = req.params.userEmail;
  const filter = { user_email: email };
  const result = await usersCollection.find(filter).toArray();
  res.send(result);
});

router.get("/providersProfile", async (req, res) => {
  const id = req.query.id;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).send("Invalid ObjectId format");
  }
  const filter = { _id: new ObjectId(id) };
  const result = await usersCollection.find(filter).toArray();
  res.send(result);
});

router.patch("/update_location/:userId", async (req, res) => {
  const id = req.params.userId;
  const { user_lat, user_lon, user_location } = req.body;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      user_lat,
      user_lon,
      user_location,
    },
  };
  const result = await usersCollection.updateOne(filter, updateDoc);
  res.send(result);
});

router.patch("/update_pro/:userId", async (req, res) => {
  const id = req.params.userId;
  const { user_rating } = req.body;
  // console.log("rating: " + user_rating);
  const filter = { _id: new ObjectId(id) };
  const userData = await usersCollection.find(filter).toArray();
  const count = userData[0].user_hireCount;
  const newCount = count + 1;
  const updatedRating =
    count > 0
      ? parseFloat(
          ((userData[0].user_rating * count + user_rating) / newCount).toFixed(
            1
          )
        )
      : parseFloat(user_rating); // Parse the result to float
  const updateDoc = {
    $set: {
      user_hireCount: newCount,
      user_rating: updatedRating, // Use a different variable here
    },
  };
  const result = await usersCollection.updateOne(filter, updateDoc);
  res.send(result);
});

router.post("/post_review/:userId", async (req, res) => {
  const id = req.params.userId;
  const newReview = req.body;
  const result = await usersCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $push: {
        user_reviews: newReview,
      },
    }
  );
});

router.patch("/verification/:userId", async (req, res) => {
  const id = req.params.userId;
  const { user_phone, user_verificationStatus } = req.body;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      user_phone,
      user_verificationStatus,
    },
  };
  const result = await usersCollection.updateOne(filter, updateDoc);
  res.send(result);
});

router.get("/appointment/:id/:appDate", async (req, res) => {
  const userId = req.params.id;
  const appDate = req.params.appDate;
  console.log("date: ", appDate);
  const filter = { _id: new ObjectId(userId) };
  const userDocument = await usersCollection.findOne(filter);

  if (!userDocument) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const appointments = userDocument.appointments || [];

  // Create an array of all possible time slots you want to consider
  const allTimeSlots = [
    "8:00",
    "9:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
  ];

  const now = new Date();
  const hours = now.getHours();

  const filteredTime = appointments
    .filter((app) => app.appointmentDate === appDate)
    .map((app) => ({
      time: app.appointmentTime,
    }));

  const filteredTime2 = filteredTime.map((t) => t.time);

  const t = filteredTime2.map((time) => {
    // Check if the time contains a colon
    if (time.includes(":")) {
      return time; // If it does, leave it unchanged
    } else {
      // Extract numeric part
      const numericPart = parseInt(time, 10);

      // Check if the original time had "AM" or "PM"
      const meridian = time.includes("pm")
        ? "PM"
        : time.includes("am")
        ? "AM"
        : "";
      // Append ":00" and preserve the meridian
      return `${numericPart}:00 ${meridian}`;
    }
  });

  const adjustedTime = t.map((time) => {
    if (time.toLowerCase().includes("pm")) {
      const [hours, minutes] = time.split(":");
      const adjustedHours = (parseInt(hours, 10) % 12) + 12;
      return `${adjustedHours}:${minutes}`;
    } else {
      return time;
    }
  });
  console.log("Adjusted Time:", adjustedTime);

  // Function to extract time without meridian indicator ("am" or "pm")
  const extractTimeWithoutMeridian = (time) =>
    time.replace(/(am|pm)/i, "").trim();

  // Apply the function to each element in the array
  const filteredTimeWithoutMeridian = adjustedTime.map((time) =>
    extractTimeWithoutMeridian(time)
  );

  console.log("filteredTime2:", filteredTimeWithoutMeridian);

  const timeSlot = allTimeSlots.filter(
    (time) => !filteredTimeWithoutMeridian.includes(time.trim())
  );
  console.log("time after filteration: ", timeSlot);

  const formattedTimeArray = timeSlot
    .filter((time) => {
      const currentTime = new Date();
      const day = currentTime.getDate().toString().padStart(2, "0");
      const month = (currentTime.getMonth() + 1).toString().padStart(2, "0");
      const year = currentTime.getFullYear();
      const today = `${month}-${day}-${year}`;

      if (today === appDate) {
        console.log(today + " x " + appDate);
        return parseInt(time) > hours;
      } else return true;
    })
    .map((time) => {
      if (parseInt(time) > 12) {
        return parseInt(time) - 12 + " pm";
      } else {
        return parseInt(time) + " am";
      }
    });
  console.log("timeSlot:", formattedTimeArray);
  console.log("_____");
  res.json({ availableTimeSlots: formattedTimeArray });
});

router.post("/create-appointment/:userId", async (req, res) => {
  const id = req.params.userId;
  const newappointmentData = req.body;

  try {
    const result1 = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $push: {
          appointments: newappointmentData,
        },
      }
    );

    if (result1.modifiedCount === 1) {
      // The update for the first user was successful

      // Now, update the second user (assuming user_id is a string)
      const secondUserId = newappointmentData.user_id;

      const result2 = await usersCollection.updateOne(
        { _id: new ObjectId(secondUserId) },
        {
          $push: {
            appointments: newappointmentData,
          },
        }
      );

      if (result2.modifiedCount === 1) {
        // The update for the second user was successful
        res.status(200).json({ message: "appointments added successfully" });
      } else {
        // No document was matched for the second update
        res.status(404).json({ error: "Second user not found" });
      }
    } else {
      // No document was matched for the first update
      res.status(404).json({ error: "First user not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error adding appointments" });
  }
});

router.get("/view_appointment/:userId", async (req, res) => {
  const id = req.params.userId;
  const filter = { _id: new ObjectId(id) };
  const result = await usersCollection.find(filter).toArray();

  if (result.length > 0) {
    const appointments = result[0].appointments;
    res.json({ appointments });
  } else {
    // Handle the case when the user is not found
    res.status(404).json({ error: "User not found" });
  }
});



router.patch(
  "/updateAppointment/:userId/:clientId/:appointmentId",
  async (req, res) => {
    const userId = req.params.userId;
    const clientId = req.params.clientId; // Use req.params.clientId here
    const appointmentId = req.params.appointmentId;
    const { status } = req.body;

    try {
      const filter = {
        _id: new ObjectId(userId),
        "appointments.appointmentId": appointmentId,
      };
      const filter2 = {
        _id: new ObjectId(clientId),
        "appointments.appointmentId": appointmentId,
      };
  
      const updateDoc = { $set: { "appointments.$.status": status } };
      const updateDoc2 = { $set: { "appointments.$.status": status } };

      const result = await usersCollection.updateOne(filter, updateDoc);
      const result2 = await usersCollection.updateOne(filter2, updateDoc2);

      if (result.modifiedCount > 0 || result2.modifiedCount > 0) {
        res
          .status(200)
          .json({ message: "Appointment status updated successfully" });
      } else {
        res
          .status(404)
          .json({ error: "Appointment not found or status not updated" });
      }
    } catch (error) {
      res.status(500).json({ error: "Error updating appointment status" });
    }
  }
);



router.get("/appointment_details/:userId/:appointmentId", async (req, res) => {
  const userId = req.params.userId;
  const appointmentId = req.params.appointmentId;

  try {
    // Assuming your appointments are stored as an array of objects in your user document
    const filter = { _id: new ObjectId(userId) };
    const user = await usersCollection.findOne(filter);

    if (user) {
      const appointment = user.appointments.find(
        (appointment) => appointment.appointmentId === appointmentId
      );

      if (appointment) {
        res.status(200).json(appointment);
      } else {
        res.status(404).json({ error: "appointment not found" });
      }
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error fetching appointment" });
  }
});

router.delete(
  "/cancel_appointment/:userId/:appointmentId",
  async (req, res) => {
    const userId = req.params.userId;
    console.log("user id: " + userId);
    const appointmentId = req.params.appointmentId;
    const filter = { _id: new ObjectId(userId) };
    const update = {
      $pull: { appointments: { appointmentId: appointmentId } },
    };

    try {
      const document = await usersCollection.findOne(filter);

      if (document) {
        const appointments = document.appointments;
        const appointment = appointments.find(
          (router) => router.appointmentId === appointmentId
        );

        if (appointment) {
          const userId2 =
            userId === appointment.pro_id
              ? appointment.user_id
              : appointment.pro_id;

          console.log("pro id: " + userId2);

          const filter2 = { _id: new ObjectId(userId2) };
          const update2 = {
            $pull: { appointments: { appointmentId: appointmentId } },
          };
          const result = await usersCollection.updateOne(filter, update);
          const result2 = await usersCollection.updateOne(filter2, update2);
        } else {
          res.status(404).json({ error: "appointment not found" });
        }
      } else {
        res.status(404).json({ error: "User not found" });
      }

      // Send a success response or other routerropriate response here
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "An error occurred" });
    }
  }
);

router.patch("/approved/:id", async (req, res) => {
  const id = req.params.id;

  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      status: "approved",
    },
  };

  const result = await usersCollection.updateOne(filter, updateDoc);
  res.send(result);
});

router.patch("/denied/:id", async (req, res) => {
  const id = req.params.id;
  // console.log(id);
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      status: "denied",
    },
  };

  const result = await usersCollection.updateOne(filter, updateDoc);
  res.send(result);
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/uploadImg", upload.single("image"), async (req, res) => {
  try {
    // Upload image to ImgBB using Axios
    const response = await axios.post(
      "https://api.imgbb.com/1/upload",
      `key=c517af6130b3e42c451a633ca7f2c403&image=${req.file.buffer.toString(
        "base64"
      )}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Send back the ImgBB response to the client
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.patch("/updateProfile/:userId", async (req, res) => {
  const id = req.params.userId;
  const { user_fullname, user_email, user_phone, user_img } = req.body;
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      user_fullname,
      user_email,
      user_phone,
      user_img,
    },
  };
  const result = await usersCollection.updateOne(filter, updateDoc);
  res.send(result);
});

router.patch("/updateVerificationStatus/:userId", async (req, res) => {
  const id = req.params.userId;
  const {
    user_phone,
    nid_img,
    license_img,
    user_verificationStatus2,
    admin_approval,
  } = req.body;
  console.log("abcd: ", nid_img);
  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: {
      user_phone,
      nid_img,
      license_img,
      user_verificationStatus2,
      admin_approval,
    },
  };
  const result = await usersCollection.updateOne(filter, updateDoc);
  res.send(result);
});

module.exports = router;
