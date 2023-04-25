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


app.use(cors());
app.use(express.json());

//kopierat
// const mongoUrl = "mongodb+srv://rebecka:hemligtpwd@cluster1.ho8up.mongodb.net/nyhetsbrev?retryWrites=true&w=majority";
// const mongoUrlLocal = "mongodb://127.0.0.1:27017";
// const myMongo = require('mongodb').MongoClient;
// myMongo.connect(mongoUrl, {
// useUnifiedTopology:true}).then(client => {console.log("uppkopplad mot databas");
// const myDatabase = client.db("nyhetsbrev");
// app.locals.myDatabase = myDatabase})


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

app.post('/', function (req, res) {
  console.log('postat')
  console.log(req.body);
  res.send({"din fil heter": req.body.filename});
  //req.app.locals.con.connect((err) => {
  //   if (err) {
  //     console.log("det blev fel: ", err)
  //   }
  //   let sql = `INSERT INTO documents (docContents, userId, docName) VALUES (${SqlString.escape(req.body.docContents)}, ${req.body.userId}, ${SqlString.escape(req.body.docName)})`;
  //   req.app.locals.con.query(sql, (err, result) => {
  //     if (err) {
  //       console.log("det blev fel: ", err)
  //     }
  //     res.json("<h3>dokument sparat!</h3>");
  //   })
  // })
})

app.locals.users = [];

//vid connect skickas ett meddelande till frontend och användare läggs till i listan
io.on("connection", (socket) => {
  console.log(`användare med id ${socket.id} kopplade upp`);
  socket.on("disconnect", () => {
    console.log(`användare med id ${socket.id} kopplade ner`);
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

app.get("/", (res) => {
  res.json({
    message: "Här finns bara en bakända",
  });
});

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
