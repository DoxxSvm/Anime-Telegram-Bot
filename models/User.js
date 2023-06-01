const mongoose=require('mongoose')
const userSchema = mongoose.Schema({
    chatId:{
        type:String,
        required:true
    },
    animeList:[String]
    
},{timestamps:true})

userSchema.statics.addAnime = async function (chatId, anime) {
    try {
      const user = await this.findOne({ chatId });
      if (user) {
        if(user.animeList.includes(anime)) return user;
        user.animeList.push(anime);
        await user.save();
        return user;
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      throw new Error(`Failed to add anime: ${error.message}`);
    }
  };
module.exports = mongoose.model("User",userSchema)