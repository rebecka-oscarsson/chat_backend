const { addUserMessage, isFirstMessage } = require("./services");

const prompts = [
  "You are a jellyfish swimming in the ocean. The person talking to you is also a jellyfish. You find them quite attractive and answer them in a fliratious manner",
  "You are a jellyfish of the species Aurelia aurita. You are skilled in marine biology and oceanography and mention some facts when you get a chance",
  "You express yourself in the style of Charles Bukowski and sometimes mention common subjects from his books",
  "Answer with a short poem based on what the person talking to you has said. Include one of their sentences",
  "You are an angry old jellyfish with dementia who is quite confused and incoherrent. You are prejudiced against sea cucumbers"
];

let promptIndex = prompts.length;

async function fetchAiAnswer(userMessages) {
  promptIndex++;
  if (promptIndex >= prompts.length) {
    promptIndex = 0;
  }
  const prompt = [
    {
      role: "system",
      content: prompts[promptIndex],
    },
  ];
  const messages = prompt.concat(userMessages);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: messages,
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });
    if (!response.ok) {
      throw new Error("No valid response");
    }
    const json = await response.json();
    if (json && json.choices && json.choices.length > 0) {
      const answer = json.choices[0].message.content;
      return answer;
    } else {
      throw new Error("No completion found");
    }
  } catch (error) {
    throw error;
  }
}

//returnerar totalt antal meddelanden i chatten
function numberOfMessages(userList) {
  let count = 0;
  for (let index = 0; index < userList.length; index++) {
    const user = userList[index];
    const messagesForUser = user.messages.length;
    count += messagesForUser;
  }
  return count;
}

//hämtar de senaste meddelandena från en användare,
//returnerar i det format API:t vill ha
function getLatestMessages(userId, userList) {
  if (!userId || !userList) {
    return;
  }
  let userWhoTalked = userList.find((user) => user.socketID === userId);
  let messages = userWhoTalked?.messages;
  if (messages?.length > 4) {
    messages = messages.slice(-4);
  }
  return messages?.map((message) => {
    return { role: "user", content: message.text };
  });
}

//bestämmer hur ofta fishBot pratar beroende på antal användare & meddelanden
function fishBotShouldTalk(userList) {
  if (userList.length === 2) {
    return true;
  } else if (userList.length < 5 && numberOfMessages(userList) % 3 === 0) {
    return true;
  } else {
    return numberOfMessages(userList) % 4 === 0;
  }
}

//skickar meddelandet från fishBot till frontend
async function makeFishBotTalk(io, userList, latestMessage) {
  if (fishBotShouldTalk(userList)) {
    const latestMessagesFromUser = getLatestMessages(
      latestMessage.socketID,
      userList
    );
    const aiReply = await fetchAiAnswer(latestMessagesFromUser);
    let messageObject = {
      text: aiReply,
      name: "fishbot",
      id: `fishbot${Math.random()}`,
      socketID: "fishbot",
    };
    addUserMessage(messageObject, userList);
    io.emit("updateUserList", userList);
    io.emit("messageToUsers", {
      id: messageObject.id,
      socketID: messageObject.socketID,
      first: isFirstMessage(messageObject.socketID, userList),
    });
  }
}
//todo: funktion för att boten ska röra sig:
//sätt ett intervall för om boten ska röra sig
//om den ska röra sig bestäm åt vilket håll och hur långt
//sätt intervall och anropa setUserPosition ett visst antal gånger
//(beroende på hur långt den ska simma)

module.exports = { makeFishBotTalk };
