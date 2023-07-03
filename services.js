function changePosition(pressedKey, position) {  let moveDistance = 0.2;
  switch (pressedKey) {
    case "ArrowLeft":
      if (position.left > 0) {
        //fish.classList.add("mirror");
        position.left -= moveDistance;
      }
      break;
    case "ArrowRight":
      if (position.left < 100) {
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
      if (position.top < 100) {
        position.top += moveDistance;
      }
      break;
  }
  return position;
}

function setUserPosition(data, users) {
  return users.map((user) => {
    if (user.socketID == data.socketID) {
      user.position = changePosition(data.pressed, user.position, user.widthToHeightRatio);
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
}

function stopUserMove(socketID, users) {
  return users.map((user) => {
    if (user.socketID == socketID) {
      user.movement = null;
    }
  });
}

module.exports = {
  changePosition,
  setUserPosition,
  addUserMessage,
  isFirstMessage,
  stopUserMove,
};
