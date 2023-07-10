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
  ['Mononogatari 2nd Season', '-1001606905335'],
  ['Reborn as a Vending Machine, Now I Wander the Dungeon', '-1001712616115'],
  ['My Happy Marriage', '-1001986970999'],
  ['Helck', '-1001988206798'],
  ['Bungou Stray Dogs 5th Season', '-1001943256847'],
  ['Spy Classroom Season 2', '-1001809331617'],
  ['The Devil is a Part-Timer! Season 2', '-1001987611044'],
  ['Saint Cecilia and Pastor Lawrence', '-1001877542952'],
  ['Jujutsu Kaisen Season 2', '-1001850954523'],
  ['Undead Girl Murder Farce', '-1001856952090'],
  ['The Great Cleric', '-1001682090037'],
  ['Sugar Apple Fairy Tale Part 2', '-1001687408382'],
  ['Rurouni Kenshin: Meiji Kenkaku Romantan (2023)', '-1001949946070'],
  ['The Masterful Cat Is Depressed Again Today', '-1001893126165'],
  ['The Gene of AI', '-1001932580615'],
  ['The Seven Deadly Sins: Grudge of Edinburgh Part 2', '-1001895296884'],
  ['Bleach Thousand-Year Blood Ear - The separation Part 2', '-1001915337363'],
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
  ['One Piece','-1001922349630']

]);

const animes = [...animeMap.keys()]


mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));



bot.on('channel_post', async (msg) => {
  const channelID = msg.chat.id
  console.log(channelID)
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
  else if(msg.document){
    message.file = msg.document.file_id
    message.caption = msg.caption
  }

  for (let chatId of list) {
    sendMsg(message, chatId)
  }


  Channel.addMsg(channelID, message)
    .then((channel) => {
      
    })
    .catch((error) => {
      console.error(error);
    });

});

bot.setMyCommands([
  { command: "start", description: "To get started" },
  { command: "previous", description: "Watch previous episodes" },
  { command: "mylist", description: "See your anime watchlist" },
  { command: "remove", description: "Remove anime from your watchlist" },
  { command: "add", description: "Add anime o your watchlist" },
  { command: "donate", description: "Support our work and help us grow!" },
  { command: "help", description: "Need help or have a query? Contact Us" },
]);

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Send your query to @DoxxSvm');
})

bot.onText(/\/donate/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Your support is greatly appreciated. We are grateful for your donation.\n\nUPI - thenotosvm@okhdfcbank');
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

    const button = list.map((movie) => {
      return [{ text: getKeyByValue(animeMap, movie).concat(` \u{21A9}`) }];
    });

    sendMessageWithButtons(chatId, 'Select the anime from the list below to view all available episodes:', button);

  }
})

bot.onText(/\/remove/, async (msg) => {
  const chatId = msg.chat.id;
  const list = await getAnimeList(chatId) //list of channel Ids
  if (list.length === 0) bot.sendMessage(chatId, 'You have not added any anime :(');
  else {

    const movieButtons = list.map((movie) => {
      return [{ text: getKeyByValue(animeMap, movie).concat(` \u{2796}`)}];
    });

    sendMessageWithButtons(chatId, 'Select the anime you wish to remove from your watchlist:', movieButtons);

  }
})


bot.onText(/\/add/, async (msg) => {
  const chatId = msg.chat.id;

  const list = await getAnimeList(chatId)
  const notAdded = animes.filter((element) => !list.includes(animeMap.get(element))); //list of anime name

  const movieButtons = notAdded.map((movie) => {
    return [{ text: movie.concat(` \u{2795}`) }];
  });

  sendMessageWithButtons(chatId, 'Select the anime you wish to add to your watchlist:', movieButtons);
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
  if (payload.length >0) {
    const anime = payload.length == 20?payload.substring(0,payload.length-6):payload
    addAnime(chatId, anime)
  }
  else{
    firstTimeMsg(chatId,msg)
  }

});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const data = msg.text;

  if (data.endsWith(` \u{2795}`)) { //add
    const anime = data.substring(0, data.length - 2)
    addAnime(chatId, animeMap.get(anime))
    createPreviousButton(chatId, anime)

  }
  else if (data.endsWith(` \u{2796}`)) { //remove
    const anime = data.substring(0, data.length - 2)
    await removeAnime(animeMap.get(anime), chatId)
    bot.sendMessage(chatId, `${anime} is removed from your watchlist.`);
  }
  else if (data.endsWith(` \u{21A9}`)) { //prev
    const channel = data.substring(0, data.length - 2)
    const msgList = await getMessageList(animeMap.get(channel))
    sendPreviousMsgs(msgList, chatId)
  }


  
});

const sendMessageWithButtons=(chatId,message,buttons)=>{
  const keyboard = {
    keyboard: buttons,
    one_time_keyboard: false,
    resize_keyboard: true
  };

  // Send the quality selection buttons in the keyboard
  return bot.sendMessage(chatId, message, {
    reply_markup: keyboard
  });
}


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
  if (message.file) {
    const caption = message.caption ? message.caption : ""
    const file = message.file
    try {
      bot.sendDocument(
        chatId,
        file,
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
      
    })
    .catch((error) => {
      console.error(error);
    });
}

const sendDataFromPayload = async (msg,chatId, payload) => {
  payload = payload.toString()

  const quality  = payload.substring(payload.length-3,payload.length)
  const episode  = payload.substring(payload.length-6,payload.length-3)

  payload = payload.substring(0,payload.length-6)

  const msgList = await getMessageList(payload)
  if (msgList.length === 0) return
  for (let i = msgList.length-1; i >= 0; i--) {
    if (msgList[i].video && msgList[i].caption && msgList[i].caption.includes(episode) && msgList[i].caption.includes(quality)) {
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

    if (msgList[i].file && msgList[i].caption.includes(episode) && msgList[i].caption.includes(quality)) {
      const message = msgList[i]
      const caption = message.caption ? message.caption : ""
      try {
        bot.sendDocument(chatId, message.file,{ caption: caption }).then(()=>{
          const movieButtons = [[{ text: "Watch Previous", callback_data: payload.concat('previous') }]];
          const keyboard = {inline_keyboard: movieButtons,};
          return bot.sendMessage(chatId, "Want to watch previous episodes?", {reply_markup: keyboard,});
        }).then(()=>{
          sleep(5000).then(()=>{
            firstTimeMsg(chatId,msg)
          })
          
        })
        return
      }
      catch (error) { }
    }
  }
}

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const firstTimeMsg = async (chatId, msg) => {
  bot.sendMessage(chatId, `Hi ${msg.from.first_name}!!\nWelcome to AnimeNetwork! Your own personalized Anime bot. Add Anime to your watchlist by selecting from the list below:
  `).then(()=>{
    const buttons = animes.map((movie) => {
      return [{ text: movie.concat(` \u{2795}`) }];
    });
  
    sendMessageWithButtons(chatId, 'Choose your Anime(s):',buttons )
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
    else {
      if(payload.length == 0) return
      if(payload.length == 14){
        const msgList = await getMessageList(payload)
        sendPreviousMsgs(msgList, chatId)
        return
      }
      sendDataFromPayload(msg,chatId, payload)
    }

    
    

  }
  catch (e) {
    console.log(e.message)
  }

}







