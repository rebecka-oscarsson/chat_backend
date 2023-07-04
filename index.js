const {  setUserPosition,
  addUserMessage,
  isFirstMessage,
  stopUserMove,
} = require("./services");
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

app.use(cors());
app.use(express.json());

app.use(express.static(__dirname + '/uploads'));

const avatarRouter = require("./routes/avatars");
app.use("/avatars", avatarRouter);

//kopierat
// const mongoUrl = "mongodb+srv://rebecka:hemligtpwd@cluster1.ho8up.mongodb.net/nyhetsbrev?retryWrites=true&w=majority";
// const mongoUrlLocal = "mongodb://127.0.0.1:27017";
// const myMongo = require("mongodb").MongoClient;
// myMongo
//   .connect(mongoUrlLocal, {
//     useUnifiedTopology: true,
//   })
//   .then((client) => {
//     console.log("uppkopplad mot databas");
//     const myDatabase = client.db("chat");
//     app.locals.myDatabase = myDatabase;
//   });

// app.post('/uploadtest', function (req, res) {
//   req.app.locals.myDatabase.collection("avatars").insertOne(req.body).then(()=> {
//   res.json("svar från bakända");
// })
// })

app.locals.users = [];

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

app.get("/", (req, res) => {
  res.json({
    message: "Här finns bara en bakända",
  });
});

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
