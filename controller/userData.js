import { get ,mongoose} from "mongoose";
import User from "../models/userSchema.js";
import Tweet from "../models/tweetSchema.js";
import cloudinary from "../config/cloudinaryconfig.js";



export const userData = {

  getMyProfile: async (req, res) => {
    const users = await User.find({ username: req.user.username })
      .populate("tweets")
      .exec();
     
      
    res.status(200).json(users);
  },
  getuserDetails: async (req, res) => {
   
    const users = await User.find({ username: req.user.username })
      .populate("followers")
      .populate("following")
      .populate("tweets")
      .populate("name")
      .populate("profilePicture")
      .populate("bio")
      .populate("username")
      .exec();
    res.status(200).json(users);
  },
  getAllfollowingPosts: async (req, res) => {
   
 
    try {
      const username = req.user.username;
    
      const user = await User.findOne({ username: username })
      .populate("profilePicture")
      .populate({
        path: 'following',
        populate: {
          path: 'tweets', 
        }
      });
    
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
    
      const formattedFriends = user.following.map(friend => ({
        username: friend.username,
        name: friend.name,
        tweets: friend.tweets,
      }));
      let arr=[];
    formattedFriends.map(friend => {
        arr.push(friend.tweets)  
    })
    arr=arr.flat();
    arr.sort((a, b) => b.createdAt - a.createdAt);
    let ans=[]
  
      res.status(200).json({arr});
    }
   
    catch (err) {
      res.status(500).json({ message: err.message });
    }
  
  },
  postTweet: async (req, res) => {
    try {
      const { username } = req.user;
      const{content} = req.body;
      const userId = await User.findOne({ username: username });
      console.log(username,content)
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const file = req.file;
      let mediaUrl = '';

      if (file) {
        const result = await cloudinary.uploader.upload(file.path);
        mediaUrl = result.secure_url;
      }

      const tweet = new Tweet({
        username: username,
        name: userId.name,
        profilePicture: userId.profilePicture,
        content,
        media: mediaUrl||'not posted on cloud',
      });
      const savedTweet = await tweet.save();

      await User.updateOne(
        { _id: userId._id },
        { $push: { tweets: savedTweet._id } }
      );

      res.status(201).json(savedTweet);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  
},
deleteTweet: async (req, res) => {
    try {
      
      const { id } = req.body;
      const tweet = await Tweet.findOne({ _id: id });
      console.log(tweet,"tweet");
      if (!tweet) {
        return res.status(404).json({ error: "Tweet not found" });
      }
      await Tweet.deleteOne({ _id: id });
      res.status(204).json({ message: "Tweet deleted successfully" });

}
catch{
      console.error("Error deleting tweet:");
      res.status(500).json({ error: "Internal server error" });
    }

},
updateTweet: async (req, res) => {
  try {
    const { id, content} = req.body;
    console.log(id,"id of update tweet");
    const tweet = await Tweet.findOne({ _id: id });

    const updateData = {};
    
    if (content !== null && content !== undefined) {
      updateData.content = content;
    }
    const file = req.file;
    if (file) {
      const result = await cloudinary.uploader.upload(file.path);
      updateData.media = result.secure_url;
    }
    console.log(updateData)
    const tweetUpdateResult = await Tweet.updateOne(
      { _id: id },
      { $set: updateData },
      { new: true }
    );
    console.log(tweetUpdateResult,"tweet");
    if (!tweet) {
      return res.status(404).json({ error: "Tweet not found" });

}

res.status(200).json({ message: "Tweet updated successfully",});

}
catch{
      res.status(500).json({ error: "Internal server error" });
    }

  },

  

  followUser: async (req, res) => {
    console.log("request follow me aya hai")
    try {
      const { username } = req.user;
      const second=username
      const {first}=req.body;
      const firstUser = await User.findOne({ username: first });
      const secondUser = await User.findOne({ username: second });
      console.log("request follow me aya hai",first,second)
      if (!firstUser) {
        return res.status(404).json({ error: "User not found" });
      }
    
      if (!secondUser) {
        return res.status(404).json({ error: "User2 not found" });
      }
    
      await User.updateOne(
        { _id: firstUser._id },
        { $push: { followers: secondUser._id } }
      );
    
      await User.updateOne(
        { _id: secondUser._id },
        { $push: { following: firstUser._id } }
      );
    
      res.status(200).json({ message: "User followed successfully" });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ error: "Internal server error" });
    }},

    unFollowUser: async (req, res) => {
      try {
        const { username } = req.user;
        const second=username
        const {first}=req.body
        const firstUser = await User.findOne({ username: first });
        const secondUser = await User.findOne({ username: second });
        console.log("request unfollow me aya hai",first,second)
        if (!firstUser) {
          return res.status(404).json({ error: "User not found" });
        }
      
        if (!secondUser) {
          return res.status(404).json({ error: "User2 not found" });
        }
      
        await User.updateOne(
          { _id: firstUser._id },
          { $pull: { followers: secondUser._id } }
        );
      
        await User.updateOne(
          { _id: secondUser._id },
          { $pull: { following: firstUser._id } }
        );
      
        res.status(200).json({ message: "User unfollowed successfully" });
      } catch (error) {
        console.error("Error following user:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    },
    getFollowers: async (req, res) => {
      try {
        const { username } = req.user;
        const user = await User.findOne({ username: username });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        const followers = await User.find({ _id: { $in: user.followers } })
         .populate("username", "name")
         .exec();
        res.status(200).json({ followers });


    }catch (error) {
      console.error("Error fetching followers:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  getFollowing: async (req, res) => {
    try {
      const { username } = req.user;
      const user = await User.findOne({ username: username });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const following = await User.find({ _id: { $in: user.following } })
       .populate("username", "name")
       .exec();
      res.status(200).json({ following });  }
    catch (error) {
      console.error("Error fetching following:", error);
      res.status(500).json({ error: "Internal server error" });
    }},
   
   
    updateProfile: async (req, res) => {
      try {
        console.log("yaha aya");
        const { username } = req.user;
        const updateData = {};
        const { name, bio, location } = req.body;
    
        if (name !== null && name !== undefined) {
          updateData.name = name;
        }
        if (bio !== null && bio !== undefined) {
          updateData.bio = bio;
        }
    
        const file = req.file;
        if (file) {
          const result = await cloudinary.uploader.upload(file.path);
          updateData.profilePicture = result.secure_url;
        }
        const tweetUpdateResult = await Tweet.updateMany(
          { username: req.user.username },
          { $set: { profilePicture:  updateData.profilePicture } }
        );
        console.log('Tweet update result:', tweetUpdateResult);
    
        const updatedUser = await User.findOneAndUpdate(
          { username: username },
          { $set: updateData },
          { new: true }
        );

    
        res.status(200).json({ message: "User updated successfully", updatedUser });
      } catch (error) {
        res.status(500).json({ error });
      }
    },

  

    searchUser: async (req, res) => {
      let follow=false
      const{username}=req.user
      let { searchQuery } = req.body;
      const check = await User.findOne({ username: searchQuery });

      const user = await User.findOne({ username: username })
   

    follow = user.following.includes(check._id);     
      if (!check) {
        res.status(404).json({ message: "User not found" });
      } else {
        console.log(check);
        res.status(200).json({ data: check ,follow:follow});
      }
    }
};
