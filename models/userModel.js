import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    
    username: {
                 type: String,
                 required: true
              },
    password: {
                 type: String,
                 required: true,
                
              },
    email:    {
                 type: String,
                 required: true,
              },    
    avatar:   {
                 type: String,
              },
    posts:    {
                 type: Number,
                 default: 0
              }
    });

const User = mongoose.model('User', userSchema);

export default User 
