const users = require('./models/User')
const channels = require('./models/ChannelMessages')

const addAnime = async (chatId,anime)=>{
    const user = await users.findOne({chatId:chatId})
    console.log(user)
    var list = user.animeList
    console.log(list)
    
    if(!list) list = []
    if(list.includes(anime)) return
    list.push(anime)
    console.log(list)
    const n = await user.findOneAndUpdate({chatId:chatId},{animeList:list},{  returnOriginal: false})
    console.log(n)

}

const addUser = async (chatId)=>{
    let user = await users.findOne({chatId:chatId})
    if(!user){
        user = await users.create({chatId:chatId})
    }
    console.log(user)
}

const getChatList = async(animeName) =>{
    try {
        const _users = await users.find({ animeList: animeName }, 'chatId');
        const chatIDs = _users.map((user) => user.chatId);
        console.log('chat IDs:', chatIDs);
        return chatIDs
    } catch (error) {
        console.error(error);
    }
    return []

}
const getAnimeList = async(chatId)=>{
    try {
        const user = await users.findOne({ chatId: chatId });
        if(user){
            return user.animeList
        }
        return []
    } catch (error) {
        console.error(error);
    }
    return []
}

const removeAnime =  async(anime,chatId)=>{
    try{
        const user = await users.findOne({chatId:chatId})
        users.updateOne(
            { _id: user.id },
            { $pull: { animeList: anime } }
          )
            .then(() => {
              console.log('Element removed successfully');
              
            })
            .catch((error) => {
              console.error('Failed to remove element:', error);
              
            });

    }
    catch(e){

    }
}

const getMessageList = async(channelUserName)=>{
    try {
        const channel = await channels.findOne({ channelUserName: channelUserName });
        if(channel){
            return channel.message
        }
        return []
    } catch (error) {
        console.error(error);

    }
    return []
}


module.exports = {addAnime,addUser,getChatList,getAnimeList, removeAnime, getMessageList}