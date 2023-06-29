const TelegramBot = require('node-telegram-bot-api');
const { addUser, getChatList, getAnimeList, removeAnime, getMessageList } = require('./controllers')
require("dotenv").config()
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });
const mongoose = require('mongoose');
const User = require('./models/User');
const Channel = require('./models/ChannelMessages')
const Message = require('./class/Message')


const MONGO_URI = process.env.MONGO_URI
const animeMap = new Map([
  ['Mushoku Tensei II: Isekai Ittara Honki Dasu', '-1001909802327'],
  ['Masamune-kuns Revenge R', '-1001639616992'],
  ['Dark Gathering', '-1001932797075'],
  ['Sweet Reincarnation', '-1001920350753'],
  ['The Dreaming Boy is a Realist', '-1001965701172'],
  ['The Girl I Like Forgot Her Glasses', '-1001955807339'],
  ['Monogatari 2nd Season', '-1001606905335'],
  ['Reborn as a Vending Machine, Now I Wander the Dungeon', '-1001712616115'],
  ['My Happy Marriage', '-1001986970999'],
  ['Helck', '-1001988206798'],
  ['Bungou Stray Dogs 5th Season', '-1001943256847'],
  ['Spy Kyoushitsu', '-1001809331617'],
  ['The Devil is a Part-Timer! Season 2', '-1001987611044'],
  ['Saint Cecilia and Pastor Lawrence', '-1001877542952'],
  ['Jujutsu Kaisen', '-1001850954523'],
  ['Undead Girl Murder Farce', '-1001856952090'],
  ['The Great Cleric', '-1001682090037'],
  ['Sugar Apple Fairy Tale Part 2', '-1001687408382'],
  ['Rurouni Kenshin: Meiji Kenkaku Romantan (2023)', '-1001949946070'],
  ['The Masterful Cat Is Depressed Again Today', '-1001893126165'],
  ['The Gene of AI', '-1001932580615'],
  ['The Seven Deadly Sins: Grudge of Edinburgh Part 2', '-1001895296884'],
  ['Bleach: Thousand-Year Blood Ear - The separation', '-1001915337363'],
  ['Horimiya: The Missing Pieces', '-1001897637040'],
  ['Liar Liar', '-1001688635520'],
  ['Masamune-kuns Revenge R', '-1001639616992'],
  ['Rent-a-Girlfriend Season 3', '-1001981043091'],
  ['My Unique Skill Makes Me OP Even at Level 1', '-1001936471217'],
  ['Zom 100: Bucket List of the dead', '-1001908276304'],
  ['Ayaka: A Story of Bonds and Wound', '-1001988089614'],
  ['My Tiny Senpai', '-1001866593232'],
  ['Am I Actually the Strongest?', '-1001839968182'],
  ['TenPuru: No One Can Live on Loneliness', '-1001966366480'],
  ['Atelier Ryza: Ever Darkness & the Secret Hideout', '-1001927332491'],
  ['The Most Heretical Last Boss Queen: From Villainess to Savior', '-1001913268286'],
  ['The Duke of Death and His Maid Season 2', '-1001635582767'],
  ['Classroom for Heroes', '-1001888162080'],

]);

const animes = [...animeMap.keys()]


mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));



bot.on('channel_post', async (msg) => {
  const channelID = msg.chat.id
  console.log(msg.chat.title,msg.chat.id)
  const list = await getChatList(channelID)
  const message = new Message()
  if (msg.text) {
    message.text = msg.text
  }
  else if (msg.photo) {
    const photo = msg.photo.pop();
    message.photo = photo.file_id
    message.caption = msg.caption
  }
  else if (msg.video) {
    const video = msg.video;
    message.video = video.file_id
    message.caption = msg.caption

  }

  for (let chatId of list) {
    sendMsg(message, chatId)
  }

  Channel.addMsg(channelID, message)
    .then((channel) => {
      console.log(`Added ${message} to msgList`);
      console.log(channel)
    })
    .catch((error) => {
      console.error(error);
    });

});

bot.setMyCommands([
  { command: "start", description: "To get started" },
  { command: "previous", description: "Watch previous episodes" },
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
      listMsg += getKeyByValue(animeMap, anime)
      listMsg += "\n"
    }
    bot.sendMessage(chatId, `Your anime list \n${listMsg}`);

  }
})

bot.onText(/\/previous/, async (msg) => {
  const chatId = msg.chat.id;
  const list = await getAnimeList(chatId) //list of channel Ids
  if (list.length === 0) bot.sendMessage(chatId, 'You have not added any anime :(');
  else {

    const movieButtons = list.map((movie) => {
      return [{ text: getKeyByValue(animeMap, movie), callback_data: movie.concat('previous') }];
    });

    const keyboard = {
      inline_keyboard: movieButtons,
    };

    bot.sendMessage(chatId, 'Choose your Anime(s):', {
      reply_markup: keyboard,
    });

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


// bot.onText(/\/start (.+)/, async (msg,match) => {
//   const chatId = msg.chat.id;
//   const payload = match[1];
//   console.log(payload)
//   console.log(msg)

//   joinMainChannel(msg.from.id,chatId,payload)
//   addAnime(chatId,payload)

// });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const payload = msg.text.substring(7);
  await addUser(chatId)
  joinMainChannel(msg,msg.from.id, chatId, payload)
  if (payload.length > 0) {
    addAnime(chatId, payload.substring(0,payload.length-3))
  }
  else{
    firstTimeMsg(chatId,msg)
  }
  


});


bot.on('polling_error', (error) => {
  console.log(`Polling error: ${error.message}`);
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  if (data.endsWith('add')) {
    const anime = data.substring(0, data.length - 3)
    addAnime(chatId, animeMap.get(anime))
    createPreviousButton(chatId, anime)

  }
  else if (data.endsWith('remove')) {
    const anime = data.substring(0, data.length - 6)
    await removeAnime(anime, chatId)
    bot.sendMessage(chatId, `${getKeyByValue(animeMap, anime)} is removed from your watchlist.`);
  }
  else if (data.endsWith('previous')) {
    const channel = data.substring(0, data.length - 8)
    const msgList = await getMessageList(channel)
    sendPreviousMsgs(msgList, chatId)
  }

});

function createPreviousButton(chatId, anime) {
  const movieButtons = [[{ text: `Watch previous episodes`, callback_data: animeMap.get(anime).concat('previous') }]];

  const keyboard = {
    inline_keyboard: movieButtons,
  };

  bot.sendMessage(chatId, `${anime} is added to your watchlist.`, {
    reply_markup: keyboard,
  });
}

function sendPreviousMsgs(msgList, chatId) {
  if(msgList.length ===0){
    bot.sendMessage(chatId, `Anime is not aired yet.`)
    return
  }
  for (let message of msgList) {
    sendMsg(message, chatId)
  }
}

function sendMsg(message, chatId) {
  if (message.text) {
    try {
      bot.sendMessage(chatId, message.text);
    } catch (error) { }

  }
  if (message.photo) {
    const caption = message.caption ? message.caption : ""
    try {
      bot.sendPhoto(
        chatId,
        message.photo,
        { caption: caption }
      );
    }
    catch (error) { }

  }
  if (message.video) {
    const caption = message.caption ? message.caption : ""
    try {
      bot.sendVideo(
        chatId,
        message.video,
        { caption: caption }
      );
    }
    catch (error) { }

  }
}

function getKeyByValue(map, searchValue) {

  for (const [key, value] of map) {
    if (value === searchValue) {
      return key;
    }
  }
  return null; // Value not found
}

function addAnime(chatId, anime) {
  User.addAnime(chatId, anime)
    .then((user) => {
      console.log(`Added ${anime} to animeList for chatId ${chatId}`);
      console.log('Updated user:', user);
    })
    .catch((error) => {
      console.error(error);
    });
}

const sendDataFromPayload = async (msg,chatId, payload) => {
  payload = payload.toString()
  const episode  = payload.substring(payload.length-3,payload.length)
  payload = payload.substring(0,payload.length-3)
  const msgList = await getMessageList(payload)
  if (msgList.length === 0) return
  for (let i = msgList.length-1; i >= 0; i--) {
    if (msgList[i].video && msgList[i].caption && msgList[i].caption.includes(episode)) {
      const message = msgList[i]
      const caption = message.caption ? message.caption : ""
      try {
        bot.sendVideo(chatId, message.video, { caption: caption }).then(()=>{
          const movieButtons = [[{ text: "Watch Previous", callback_data: payload.concat('previous') }]];
          const keyboard = {inline_keyboard: movieButtons,};
          return bot.sendMessage(chatId, "Want to watch previous episodes?", {reply_markup: keyboard,});
        }).then(()=>{
          firstTimeMsg(chatId,msg)
        })
        return
      }
      catch (error) { }

    }
  }
}

const firstTimeMsg = async (chatId, msg) => {
  bot.sendMessage(chatId, `Hi ${msg.from.first_name}! \nWelcome to AnimeNetwork! Your personalized anime bot.`).then(()=>{
    const movieButtons = animes.map((movie) => {
      return [{ text: movie, callback_data: movie.concat('add') }];
    });
  
    const keyboard = {
      inline_keyboard: movieButtons,
    };
  
    bot.sendMessage(chatId, 'Choose your Anime(s):', {
      reply_markup: keyboard,
    }).then(()=>{
      bot.sendMessage(chatId, `Please select Animes (listed above \u{2B06}\u{2B06}) that you want to Subscribe.`)
    });
  })

  
}

const joinMainChannel = async (msg,userId, chatId, payload) => {
  try {
    const a = await bot.getChatMember("@AnimeNet_work", userId)
    if (a.status === 'left') {
      const movieButtons = [[{ text: "Join Channel", url: "https://t.me/AnimeNet_work" }],
      [{ text: "  Refresh  ", url: 'https://t.me/AnimeNetworkOfficialBot?start='.concat(payload) }]
      ]

      const keyboard = {
        inline_keyboard: movieButtons,
      };

      bot.sendMessage(chatId, 'Please Join our main channel and then press the refresh button', {
        reply_markup: keyboard,
      });
      return
    }
    else {if(payload.length == 0) return}
    sendDataFromPayload(msg,chatId, payload)
    

  }
  catch (e) {

  }

}







