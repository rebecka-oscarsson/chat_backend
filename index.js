const express = require('express');
const app = express();
const PORT = 4000;


const http = require('http').Server(app);
const cors = require('cors');
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:3000",
        origin: "https://rebecka-oscarsson.github.io"
    }
});

app.use(cors());

  function setUserPosition(pressedKey, socketID, users) {
    return users.map((user) => {
      if (user.socketID == socketID) {
        user.position = changePosition(pressedKey, user.position);
        user.movement = pressedKey;
      }
      //return user;
    });
  }

  function stopUserMove(socketID, users) {
    return users.map((user) => {
      if (user.socketID == socketID) {
        user.movement = null;
      }
      return user;
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
      if (position.left < 96) {
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
      if (position.top < 96) {
        position.top += moveDistance;
      }
      break;
  }
  return position
}

//variabler
app.locals.users = [];
app.locals.messages = [];

//vid connect skickas ett meddelande till frontend och användare läggs till i listan

io.on('connection', (socket) => {
    console.log(`användare med id ${socket.id} kopplade upp`);
    socket.on('disconnect', () => {
        console.log(`användare med id ${socket.id} kopplade ner`);
        app.locals.users = app.locals.users.filter((user) => user.socketID !== socket.id);
        io.emit('updateUserList', app.locals.users);
        socket.disconnect();
      });
    socket.on('messageFromUser', (data) => {
        data.time = new Date();
        app.locals.messages.push(data);
        io.emit('messageToUsers', app.locals.messages);
      });
      socket.on('move', (data) => {
        setUserPosition(data.pressed, data.socketID, app.locals.users)
        io.emit('updateUserList', app.locals.users);
      });
      socket.on('stop', (data) => {
        stopUserMove(data.socketID, app.locals.users)
        io.emit('updateUserList', app.locals.users);
      });
      socket.on('newUser', (data) => {
        //Adds the new user to the list of users
        app.locals.users.push(data);
        //Sends the list of users to the client
        io.emit('updateUserList', app.locals.users);
        if (app.locals.messages.length>0) {socket.emit('messageToUsers', app.locals.messages)};
      });
});

// io.on("connection", (socket) => {
//     socket.on("connected", (enteredName) => {
//         let userObject = createUserObject(enteredName, socket.id);
//         app.locals.users.push(userObject);
//         if (app.locals.messages) {
//             for (let index = 0; index < app.locals.messages.length; index++) {
//                 socket.emit("displayMessage", app.locals.messages[index] //skickar gamla meddelanden till den nyss anslutna
//                 );
//             }
//         }
//         let connectInfo = {
//             userName: userObject.userName,
//             time: getTime(),
//             connected: true,
//             message: connectMsgs[Math.floor(Math.random() * connectMsgs.length)]
//         }
//         io.emit("displayMessage", connectInfo);
//         saveMessages(app.locals.messages, connectInfo); //sparar anslutningsmeddelande
//         io.emit("userList", app.locals.users); //skickar lista på anslutna användare
//         console.log(userObject.userName + " ansluten " + getTime());
//     })

    //vid disconnect skickas ett meddelande till frontend och användare tas bort ur listan
//     socket.on("disconnect", () => {
//         let userObject = app.locals.users.find(userObject => userObject.userId === socket.id);
//         if (userObject) { //för att undvika krasch om userObject inte går att hämta
//             let index = app.locals.users.indexOf(userObject);
//             let disconnectInfo = {
//                 userName: userObject.userName,
//                 time: getTime(),
//                 connected: false,
//                 message: disconnectMsgs[Math.floor(Math.random() * disconnectMsgs.length)]
//             }
//             io.emit("displayMessage", disconnectInfo);
//             saveMessages(app.locals.messages, disconnectInfo);
//             app.locals.users.splice(index, 1); //tar bort användare
//             io.emit("userList", app.locals.users); //skickar lista på anslutna användare
//             console.log(userObject.userName + " frånkopplad " + getTime());
//         }
//         else {
//             console.log("fel vid utloggning");
//             socket.emit("error", false); //false innebär visa ej felmeddelande
//         }
//     })

//     //när chatmeddelande kommer från en användare
//     socket.on("messageSent", (message) => {
//         let userObject = app.locals.users.find(userObject => userObject.userId === socket.id); //hitta användaren som skickat
//         if (userObject) { //för att undvika krasch om userObject inte går att hämta
//             let messageObject = createMessageObject(message, userObject);
//             console.log(messageObject.userName + " skrev: " + messageObject.message);
//             saveMessages(app.locals.messages, messageObject) //sparar senaste två meddelanden för att visa vid inlogg
//             io.emit("displayMessage", messageObject //skickar tillbaka till frontenden
//             );
//         }
//         else {
//             console.log("fel vid chattmeddelande");
//             socket.emit("error", true); //true innebär att felmeddelande ska visas
//         } 
//     })
// })

app.get('/', (req, res) => {
    res.json({
      message: 'Här finns bara en bakända',
    });
  });
  
  http.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });