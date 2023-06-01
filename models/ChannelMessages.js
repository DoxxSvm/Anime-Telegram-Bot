const mongoose=require('mongoose')
const Message = require('../class/Message')
const channelSchema = mongoose.Schema({
    channelUserName:{
        type:String,
        required:true
    },
    message:[{
      text: String,
      photo: String,
      video: String,
      caption: String
    }]
    
},{timestamps:true})

channelSchema.statics.addMsg = async function (_channelUserName, msg) {
    try {
      let channel = await this.findOne({channelUserName:_channelUserName});
      if (channel) {
        channel.message.push(msg);
        await channel.save();
        return channel;
      } else {
        channel = await this.create({
          channelUserName:_channelUserName,
          message:[msg]
        })
        console.log(channel)
        return channel
      }
    } catch (error) {
      throw new Error(`Failed to add msg: ${error.message}`);
    }
  };
module.exports = mongoose.model("Channel",channelSchema)