const express = require("express");
const app = express();
const PORT = 4000;
const http = require("http").Server(app);
const cors = require("cors");
const io = require("socket.io")(http, {
  cors: {
    origin: ["http://localhost:3000", "https://rebecka-oscarsson.github.io"],
  },
});
//const uploadController = require("./controllers/upload");
const multer = require("multer");
app.use(cors());
app.use(express.json());

app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static('uploads'));

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    const filename = `${Date.now()}-avatar-${file.originalname}`;
    cb(null, filename)
  }
})
var upload = multer({ storage: storage })

//kopierat
// const mongoUrl = "mongodb+srv://rebecka:hemligtpwd@cluster1.ho8up.mongodb.net/nyhetsbrev?retryWrites=true&w=majority";
const mongoUrlLocal = "mongodb://127.0.0.1:27017";
const myMongo = require('mongodb').MongoClient;
myMongo.connect(mongoUrlLocal, {
useUnifiedTopology:true}).then(client => {console.log("uppkopplad mot databas");
const myDatabase = client.db("chat");
app.locals.myDatabase = myDatabase})


function setUserPosition(data, users) {
  return users.map((user) => {
    if (user.socketID == data.socketID) {
      user.position = changePosition(data.pressed, user.position);
      user.movement = data.pressed;
    }
  });
}

function addUserMessage(message, users) {
  return users.map((user) => {
    if (user.socketID == message.socketID) {
      message.time = new Date();
      user.messages.push(message);
    }
  });
}

function isFirstMessage(socketID, users) {
  let userWhoTalked = users.find((user) => user.socketID === socketID);
  if (userWhoTalked?.messages.length === 1) {
    return true;
  }
  return false;
};

function stopUserMove(socketID, users) {
  return users.map((user) => {
    if (user.socketID == socketID) {
      user.movement = null;
    }
  });
}

function changePosition(pressedKey, position) {
  let moveDistance = 0.2;
  switch (pressedKey) {
    case "ArrowLeft":
      if (position.left > 0) {
        //fish.classList.add("mirror");
        position.left -= moveDistance;
      }
      break;
    case "ArrowRight":
      if (position.left < 86) {
        //fish.classList.remove("mirror");
        position.left += moveDistance;
      }
      break;
    case "ArrowUp":
      if (position.top > 0) {
        position.top -= moveDistance;
      }
      break;
    case "ArrowDown":
      if (position.top < 70) {
        position.top += moveDistance;
      }
      break;
  }
  return position;
}


//till mongodb
// app.get("/files", uploadController.getListFiles);
// app.get("/files/:name", uploadController.download);
// app.post("/upload", uploadController.uploadFiles);

app.post('/uploadtest', function (req, res) {
  //uploadController.uploadFiles
  req.app.locals.myDatabase.collection("avatars").insertOne(req.body).then(()=> {
  res.json("svar från bakända");  
})
})

app.post('/upload', upload.single('avatar'), function (req, res) {
  // req.file is the `profile-file` file
  // req.body will hold the text fields, if there were any
  console.log(JSON.stringify(req.file))
  res.json(req.file.path);
})

app.locals.users = [];

//vid connect skickas ett meddelande till frontend och användare läggs till i listan
io.on("connection", (socket) => {
  console.log(`användare ${socket.id} kopplade upp`);
  socket.on("disconnect", () => {
    console.log(`användare ${socket.id} kopplade ner`);
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
