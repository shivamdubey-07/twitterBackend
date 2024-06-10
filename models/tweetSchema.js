import mongoose from "mongoose";
const Schema = mongoose.Schema;

const tweetSchema = new Schema({
  username: { type: String, ref: 'User', required: true },
  content: { type: String, maxlength: 280 },
  media: [{ type: String }], 
  profilePicture: { type: String, default: '' },
  name: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// module.exports = mongoose.model('Tweet', tweetSchema);
const Tweet = mongoose.model("Tweet", tweetSchema);
export default Tweet;
