const TelegramBot = require('node-telegram-bot-api');
const { addUser, getChatList, getAnimeList ,removeAnime} = require('./controllers')
require("dotenv").config()
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });
const mongoose = require('mongoose');
const User = require('./User');


const MONGO_URI = process.env.MONGO_URI
const animes = ['The legendary hero is dead', 'Dr. Stone: New world', 'The ancient magus bride', 'Skip and loafer', 'Hells paradise', 'Oshi no Ko (My Star)']; // Replace with your list of movies
const animeMap = new Map([
  ["The legendary hero is dead", "500"],
  ["Dr. Stone: New world", "dr_stonee_new_world"],
  ["The ancient magus bride", "200"],
  ["Skip and loafer", "400"],
  ['Hells paradise','355'],
  ['Oshi no Ko (My Star)','4433']

]);
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));


bot.on('channel_post', async (msg) => {
  const channelName = msg.chat.username
  const list = await getChatList(channelName)
  console.log(list)

  for (let chatId of list) {

    if (msg.text) {
      bot.sendMessage(chatId, 'Channel message received: ' + msg.text);
    }
    if (msg.photo) {
      const photo = msg.photo.pop();
      bot.sendPhoto(chatId, photo.file_id);
    }
    if (msg.video) {
      const video = msg.video;
      bot.sendVideo(chatId, video.file_id);
    }

  }

});

bot.setMyCommands([
  { command: "start", description: "To get started" },
  { command: "mylist", description: "See your anime list" },
  { command: "remove", description: "Remove anime" },
  { command: "add", description: "Add anime" },
  { command: "donate", description: "Buy me a Coffee" },
  { command: "help", description: "help me out" },
]);

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Send your query to @DoxxSvm');
})

bot.onText(/\/donate/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Your support is greatly appreciated. We are grateful for your donation. \n\n Upi ID: thenotosvm@okhdfcbank');
})



bot.onText(/\/mylist/, async (msg) => {
  const chatId = msg.chat.id;
  const list = await getAnimeList(chatId)
  if (list.length === 0) bot.sendMessage(chatId, 'You have not added any anime :(');
  else {
    let listMsg = ''
    for (let anime of list) {
      listMsg += getKeyByValue(animeMap,anime)
      listMsg += "\n"
    }
    bot.sendMessage(chatId, `Your anime list \n${listMsg}`);

  }
})

bot.onText(/\/remove/, async (msg) => {
  const chatId = msg.chat.id;
  const list = await getAnimeList(chatId) //list of channel Ids
  if (list.length === 0) bot.sendMessage(chatId, 'You have not added any anime :(');
  else {

    const movieButtons = list.map((movie) => {
      return [{ text: getKeyByValue(animeMap, movie), callback_data: movie.concat('remove') }];
    });

    const keyboard = {
      inline_keyboard: movieButtons,
    };

    bot.sendMessage(chatId, 'Choose your Anime(s):', {
      reply_markup: keyboard,
    });

  }
})


bot.onText(/\/add/, async (msg) => {
  const chatId = msg.chat.id;
  
  const list = await getAnimeList(chatId)
  const notAdded = animes.filter((element) => !list.includes(animeMap.get(element))); //list of anime name

  const movieButtons = notAdded.map((movie) => {
    return [{ text: movie, callback_data: movie.concat('add') }];
  });

  const keyboard = {
    inline_keyboard: movieButtons,
  };

  bot.sendMessage(chatId, 'Choose your Anime(s) to add:', {
    reply_markup: keyboard,
  });
});


bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `Hi ${msg.from.first_name}! \nWelcome to DoxxAnime! Your personalized anime bot.`);
  await addUser(chatId)

  const movieButtons = animes.map((movie) => {
    return [{ text: movie, callback_data: movie.concat('add') }];
  });

  const keyboard = {
    inline_keyboard: movieButtons,
  };

  bot.sendMessage(chatId, 'Choose your Anime(s):', {
    reply_markup: keyboard,
  });
});


bot.on('polling_error', (error) => {
  console.log(`Polling error: ${error.message}`);
});


bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const chosenAnime = query.data;
  console.log(chosenAnime)


  if (chosenAnime.endsWith('add')) {
    const anime = chosenAnime.substring(0, chosenAnime.length - 3)
    User.addAnime(chatId, animeMap.get(anime))
      .then((user) => {
        console.log(`Added ${anime} to animeList for chatId ${chatId}`);
        console.log('Updated user:', user);
      })
      .catch((error) => {
        console.error(error);
      });

    bot.sendMessage(chatId, `${anime} is added to your watchlist.`);
  }
  else if (chosenAnime.endsWith('remove')) {
    const anime = chosenAnime.substring(0, chosenAnime.length - 6)
    await removeAnime(anime,chatId)
    bot.sendMessage(chatId, `${getKeyByValue(animeMap,anime)} is removed from your watchlist.`);
  }
});


function getKeyByValue(map, searchValue) {

  for (const [key, value] of map) {
    if (value === searchValue) {
      return key;
    }
  }
  return null; // Value not found
}







// bot.onText(/\/last10messages/, (msg) => {
//   const chatId = msg.chat.id;

//   // Get the last 10 messages from the channel
//   bot.getChatHistory(-1001612839963,0,0,10,false)
//     .then((messages) => {
//       // Send the messages to the user
//       console.log(messages)
//       bot.sendMessage(chatId, 'Last 10 messages:');
//       messages.forEach((message) => {
//         if (message.text) {
//           bot.sendMessage(chatId, 'Channel message received: ' + message.text);
//         }
//         if (message.photo) {
//           const photo = message.photo.pop();
//           bot.sendPhoto(chatId, photo.file_id);
//         }
//         if (message.video) {
//           const video = message.video;
//           bot.sendVideo(chatId, video.file_id);
//         }
//       });
//     })
//     .catch((error) => {
//       console.log(error);
//       bot.sendMessage(chatId, 'An error occurred while fetching the messages.');
//     });
// });

// bot.onText(/\/last10messages/, (msg) => {
//   const chatId = msg.chat.id;

//   // Get the latest update ID
//   const latestUpdateId = msg.update_id;

//   // Fetch the last 10 messages from the channel
//   bot.getUpdates({ offset: latestUpdateId, limit: 10 })
//     .then((updates) => {
//       const messages = updates.map((update) => update.message);
//       // Filter out messages not from the specified channel
//       const channelMessages = messages.filter((message) => message.chat.username === 'dr_stonee_new_world');
//       // Send the messages to the user
//       bot.sendMessage(chatId, 'Last 10 messages:');
//       channelMessages.forEach((message) => {
//         bot.sendMessage(chatId, message.text);
//       });
//     })
//     .catch((error) => {
//       console.log(error);
//       bot.sendMessage(chatId, 'An error occurred while fetching the messages.');
//     });
// });


