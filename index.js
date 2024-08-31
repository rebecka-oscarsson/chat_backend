const {
  setUserPosition,
  addUserMessage,
  isFirstMessage,
  stopUserMove,
} = require("./services");
const { makeFishBotTalk } = require("./fishbot.js");
const express = require("express");
const app = express();
const fs = require("fs");
const PORT = 4000;
const http = require("http").Server(app);
const cors = require("cors");
const io = require("socket.io")(http, {
  cors: {
    origin: ["http://localhost:3000", "https://rebecka-oscarsson.github.io"],
  },
});
require("dotenv").config();

app.use(cors());
app.use(express.json());
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
//app.use(express.static(__dirname))

const avatarRouter = require("./routes/avatars");
app.use("/avatars", avatarRouter);

app.locals.users = [
  {
    userName: "fishbot",
    socketID: "fishbot",
    userColor: "hsl(303, 71%, 59%)",
    position: { top: 50, left: 50 },
    messages: [],
    avatar: null,
    widthToHeightRatio: 0.72,
    movement: null,
  },
];

//vid connect skickas ett meddelande till frontend och användare läggs till i listan
io.on("connection", (socket) => {
  console.log(`användare ${socket.id} kopplade upp`);
  socket.on("disconnect", () => {
    console.log(`användare ${socket.id} kopplade ner`);
    let userWhoLeft = app.locals.users.find(
      (user) => user.socketID === socket.id
    );
    console.log("utloggad", userWhoLeft);
    if (userWhoLeft && userWhoLeft.avatar) {
      const path = "./uploads/" + userWhoLeft.avatar;
      console.log("ta bort", path);
      fs.unlink(path, (err) => {
        if (err) {
          console.error(err);
          return;
        }
      });
    }
    app.locals.users = app.locals.users.filter(
      (user) => user.socketID !== socket.id
    );
    io.emit("updateUserList", app.locals.users);
    socket.disconnect();
  });
  socket.on("messageFromUser", (data) => {
    addUserMessage(data, app.locals.users);
    io.emit("updateUserList", app.locals.users);
    makeFishBotTalk(io, app.locals.users, data);
    io.emit("messageToUsers", {
      id: data.id,
      socketID: data.socketID,
      first: isFirstMessage(data.socketID, app.locals.users),
    });
  });
  socket.on("move", (data) => {
    setUserPosition(data, app.locals.users);
    io.emit("updateUserList", app.locals.users);
  });
  socket.on("stop", (data) => {
    stopUserMove(data.socketID, app.locals.users);
    io.emit("updateUserList", app.locals.users);
  });
  socket.on("newUser", (data) => {
    //Adds the new user to the list of users
    app.locals.users.push(data);
    //Sends the list of users to the client
    io.emit("updateUserList", app.locals.users);
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "up",
  });
});

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
