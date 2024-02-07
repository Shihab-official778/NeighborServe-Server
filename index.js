const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
require("dotenv").config();
const users = require("./routes/users");
const providers = require("./routes/providers");
const chatApp = require("./routes/chatApp");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/users", users);
app.use("/providers", providers);
app.use("/chatApp", chatApp);
app.get("/", (req, res) => {
  res.send("hello");
});



app.listen(port, () => {
  console.log("hello from port 5000");
});
