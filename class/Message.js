class Message {
    constructor(text, photo, video, caption,file,thumbnail) {
      this.text = text;
      this.photo = photo;
      this.video = video;
      this.caption = caption;
      this.file = file;
      this.thumbnail = thumbnail

    }
  }

  module.exports = Message;