import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    
    title:       {
                    type: String,
                    required: true
                 },
    category:    {
                    type: String,
                    enum: ["Building_A", "Building_B"],
                    message: "{VALUE is not supported}"
                 },
    description: {
                    type: String
                 },
    thumbnail:   {
                    type: String
                 },
    creator:     {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                 }

    }, {timestamps: true});

const Post = mongoose.model('Post', postSchema);

export default Post