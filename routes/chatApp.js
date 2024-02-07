const express = require("express");
// const axios = require("axios");
const router = express.Router();
const client = require("../database/db");
const { ObjectId } = require("mongodb");

const port = process.env.PORT || 5002;
const usersCollection = client.db("NeighborServe").collection("UsersData");
const ChatsCollection = client.db("NeighborServe").collection("Chats"); // Update with your actual database and collection names
const msgCollection = client.db("NeighborServe").collection("Messages");

let Users = [];
const io = require("socket.io")(port, {
  cors: {
    origin: "http://localhost:5173",
  },
});
io.on("connection", (socket) => {
  console.log("User Connected", socket.id);
  socket.on("addUser", (userId) => {
    console.log(
      "Received 'addUser' event from",
      socket.id,
      "with userId:",
      userId
    );
    const isUserExist = Users.find((user) => user.userId === userId);
    if (!isUserExist) {
      const User = { userId, socketId: socket.id };
      Users.push(User);
      console.log("Updated Users list:", Users);
      io.emit("getUsers", Users);
    }
  });


  socket?.on(
    "sendMessage",
    async ({ conversationId, senderId, message, receiverId }) => {
      const receiver = Users.find((user) => user.userId === receiverId);
      const sender = Users.find((user) => user.userId === senderId);

      console.log("Sender: ", sender, "receiver", receiver);

      // Assuming you have a MongoDB collection named usersCollection
      const user = await usersCollection.findOne(new ObjectId(senderId));
      console.log("User", user);

      if (receiver) {
        io.to(receiver.socketId)
          .to(sender.socketId)
          .emit("getMessage", {
            conversationId,
            senderId,
            message,
            receiverId,
            user: {
              id: user._id,
              name: user.user_fullname,
              email: user.user_email,
              receiverId: receiverId,
            },
          });
      } else {
        io.to(sender?.socketId).emit("getMessage", {

          conversationId,
          senderId,
          message,
          receiverId,
          user: {
            id: user._id,
            name: user.user_fullname,
            email: user.user_email,
            receiverId: receiverId,
          },
        });
      }
    }

  );

  socket?.on("disconnect", () => {
    Users = Users.filter((user) => user.socketId !== socket.id);
    console.log("Updated Users list after disconnect:", Users);

    io.emit("getUsers", Users);
  });
});

router.get("/service_history", async (req, res) => {
  try {
    const serviceCollection = client
      .db("NeighborServe")
      .collection("serviceHistory");
    const serviceHistory = await serviceCollection.find({}).limit(10).toArray();
    res.json(serviceHistory);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

router.post("/conversations", async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    console.log("Request Body:", req.body); // Add this line for logging
    console.log("SenderId:", senderId); // Add this line for logging
    console.log("ReceiverId:", receiverId); // Add this line for logging // Add this line for logging
    if (!senderId || !receiverId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid request body" });
    }

    const existingConversation = await ChatsCollection.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (existingConversation) {
      console.log("Conversation already exists:", existingConversation);
      return res.status(200).json({
        success: true,
        existing: true,
        conversationId: existingConversation._id,
      });
    }

    const result = await ChatsCollection.insertOne({
      members: [senderId, receiverId],
      timestamp: new Date(),
    });

    res.status(200).json({ success: true, insertedId: result.insertedId });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/conversations/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).send("Invalid ObjectId format");
    }
    console.log("Requested userId:", userId);

    // Find conversations where the provided userId is in the members array
    const conversations = await ChatsCollection.find({
      members: { $in: [userId] },
    }).toArray();

    const conversationUserData = await Promise.all(
      conversations.map(async (conversation) => {
        // Find the receiver's ID in the members array
        const receiverId = conversation.members.find(
          (member) => member !== userId
        );

        // Log the receiverId
        console.log("ReceiverId:", receiverId);

        // Convert receiverId to ObjectId
        const receiverObjectId = new ObjectId(receiverId);

        // Log the receiverObjectId
        console.log("ReceiverObjectId:", receiverObjectId);

        // Find the user data using the receiver's ObjectId
        const user = await usersCollection.findOne({ _id: receiverObjectId });

        // Log the user data
        console.log("User Data Of Conversation:", user);

        // Return an object with user information
        return {
          user: {
            email: user?.user_email,
            name: user?.user_fullname,
            receiverId: user?._id,
            img: user?.user_img,
          },
          conversationId: conversation?._id,
        };
      })
    );

    res.status(200).json(conversationUserData);
    console.log("conversationUserData", conversationUserData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/message", async (req, res) => {
  try {
    const { conversationId, senderId, message, receiverId = "" } = req.body;
    console.log(conversationId, senderId, message, receiverId);

    console.log("Received request body:", req.body);
    if (!senderId || !message) {
      return res.status(400).send("Please fill all required fields");
    }

    // const msgCollection = client.db("NeighborServe").collection("Messages");
    if (conversationId === "new" && receiverId) {
      const newConversation = await ChatsCollection.insertOne({
        members: [senderId, receiverId],
      });
      console.log("New Conversation", newConversation);

      const newMessage = {
        conversationId: newConversation.insertedId,
        senderId,
        message,
        receiverId,
      };

      await msgCollection.insertOne(newMessage);
      return res.status(200).send("Message sent successfully");
    } else if (!conversationId && !receiverId) {
      return res.status(400).send("Please fill all required fields");
    }

    const newMessage = await msgCollection.insertOne({
      conversationId: new ObjectId(conversationId),
      senderId: new ObjectId(senderId),
      message,
      receiverId: new ObjectId(receiverId),
    });

    res.status(200).json(newMessage); // Return the inserted message
  } catch (error) {
    return res.status(400).send(error);
  }
});

router.get("/message/:conversationId", async (req, res) => {
  try {
    const checkMessage = async (conversationId) => {
      const messages = await msgCollection
        .find({ conversationId: new ObjectId(conversationId) })
        .toArray();

      const messageUserData = await Promise.all(
        messages.map(async (message) => {
          console.log("Fetching user for message:", message);
          console.log("Fetched receiverId:", message?.receiverId);

          const user = await usersCollection.findOne({
            _id: new ObjectId(message?.senderId),
          });

          console.log("Fetching user for message:", message);
          console.log("user:", user);

          return {
            user: {
              id: user._id,
              email: user?.user_email,
              name: user?.user_fullname,
              img: user?.user_img,
              // Include conversationId,
            },
            message: message?.message,
            conversationId: message?.conversationId,
            receiverId: message?.receiverId,
          };
        })
      );
      res.status(200).json(messageUserData);
    };

    const conversationId = req.params.conversationId;

    // if (!/^[0-9a-fA-F]{24}$/.test(new ObjectId(conversationId))) {
    //   return res.status(400).send("Invalid ObjectId format");
    // }
    if (conversationId === "new") {
      const checkConversation = await ChatsCollection.find({
        members: { $all: [req.query.senderId, req.query.receiverId] },
      }).toArray();
      if (checkConversation.length > 0) {
        checkMessage(checkConversation[0]._id);
      } else {
        return res.status(200).json([]);
      }
    } else {
      checkMessage(conversationId);
    }
  } catch (error) {
    console.log("Error", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/users/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).send("Invalid ObjectId format");
    }

    const users = await usersCollection
      .find({ _id: { $ne: userId } })
      .limit(100)
      .toArray();

    // Use Promise.all with map
    const usersData = await Promise.all(
      users.map(async (user) => {
        return {
          user: {
            email: user.user_email,
            name: user.user_fullname,
            receiverId: user._id,
            img: user?.user_img,
            // Assuming _id is an ObjectId, convert it to a string
          },
          UserId: user._id,
        };
      })
    );

    res.status(200).json(usersData);
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
