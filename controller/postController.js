
import HttpError from '../models/errorModel.js';

import User from '../models/userModel.js';
import Post from '../models/postModel.js';


import fs from "fs";
import path from 'path';
import { __dirname, __filename } from '../config.js';          //config for __dirname
import { v4 as uuidv4 } from "uuid";


//************ Create Post *********************
// POST: api/posts
const createPost = async (req, res, next) => {

                          try
                          {
                             let { title, category, description} = req.body;

                             if(!title || !category || !description || !req.files)
                             {
                                return next( new HttpError("Fill in all fields.", 422));
                             }
                            
                             const { thumbnail } = req.files;

                             if(thumbnail.size > 2000000)
                             {
                                return next( new HttpError("File size is too big. File should be less than 2mb"), 422);
                             }

                             let filename = thumbnail.name;
                             let splittedFilename = filename.split('.');
                             let newFilename = splittedFilename[0] + uuidv4() + "." + splittedFilename[splittedFilename.length - 1 ];

                             thumbnail.mv(path.join(__dirname + '/server/', '..', 'uploads', newFilename), async (err)=> {
                                       if(err)
                                       {
                                          return next(new HttpError(err));
                                       }
                             });

                             const newPost = await new Post (
                                                              {
                                                                title,
                                                                category,
                                                                description,
                                                                thumbnail: newFilename ,
                                                                creator:  req.user.id
                                                              }
                                                            );
                             newPost.save();

                             if(!newPost)
                             {
                                return next(new HttpError("Can't create new post."), 422);
                             }

                             const currentUser = await User.findById(req.user.id);
                             const userPostCount = currentUser.posts + 1;

                             await User.findByIdAndUpdate(req.user.id, {posts: userPostCount});

                             res.status(200).json(newPost);
                          }
                          catch(err)
                          {
                             return next(new HttpError(err));
                          }
}




//************ Get Posts (All Posts) ***********
// GET: api/posts
const getPosts = async (req, res, next) => {

                        try
                        {
                           const posts = await Post.find().sort({updatedAt: -1});

                           res.status(200).json(posts);
                        }
                        catch(err)
                        {
                           return next(new HttpError(err));
                        }
}




//************ Get Post (Single Post) ***********
// GET: api/posts:id
const getPost = async (req, res, next) => {

                       try
                       {
                          const postId = req.params.id;

                          const post = await Post.findById(postId);

                          if(!post)
                          {
                             return next(new HttpError("Post not found", 404));
                          }
                          
                          res.status(200).json(post);
                       }
                       catch(err)
                       {
                          return next(new HttpError(err));
                       }
}




//************ Get Posts By Category ***********
// GET: api/posts/categories/:category
const getPostCategory = async (req, res, next) => {

                               try
                               {
                                 const { category } = req.params;

                                 const categoryPosts = await Post.find({category}).sort({createdAt: -1});

                                 res.status(200).json(categoryPosts);

                               }
                               catch(err)
                               {
                                 return next(new HttpError(err));
                               }
}




//************ Get Posts By User (Author)***********
// GET: api/posts/users/:id
const getPostUser = async (req, res, next) => {

                           try
                           {
                              const userId = req.params.id;

                              const posts = await Post.find({creator: userId}).sort({createdAt: -1});

                              res.status(200).json(posts);
                           }
                           catch(err)
                           {
                              return next(new HttpError(err));
                           }
}



//************ Edit Post***********
// PATCH: api/posts/:id
const editPost = async (req, res, next) => {

                        try
                        {
                           let filename;
                           let newFilename;
                           let updatedPost

                           let { title, category, description } = req.body; 
                            
                           if(req.files)
                           {
                              let {thumbnail} = req.files;

                           }
 
                           const postId = req.params.id;

                           if(!title || !category || !description)
                           {   
                              return next(new HttpError("Fill in all fields.", 422));
                           }

                           const oldPost = await Post.findById(postId);
                           
                           if(req.user.id == oldPost.creator)
                           {
                              if(!req.files)
                              {
                                 updatedPost = await Post.findByIdAndUpdate(postId, { title, category, description}, {new: true});
                              }
                              else
                              {
                                 fs.unlink(path.join(__dirname +'/server/', '..', 'uploads', oldPost.thumbnail), async (err)=> {
                                    if(err)
                                    {
                                       return next(new HttpError(err));
                                    }
                                  
                                 });
   
                                 if(thumbnail.size > 2000000)
                                 {
                                    return next(new HttpError("File size is too big. File should be less than 2mb.", 422));
                                 }
   
                                 
                                 filename = thumbnail.name;
                                 let splittedFilename = filename.split('.');
                                 newFilename = splittedFilename[0] + uuidv4() + '.' + splittedFilename[splittedFilename.length - 1];
   
                                 thumbnail.mv(path.join(__dirname + '/server/', '..', 'uploads', newFilename), async (err)=> {
                                           if(err)
                                           {
                                              return next(new HttpError(err));
                                           }
      
                                 });

                                 
                                 updatedPost = await Post.findByIdAndUpdate(postId,{ title, category, description,thumbnail: newFilename }, { new: true} );
                             
                              }
                           }
                          
                           if(!updatedPost)
                           {
                              return next(new HttpError("Post failed to update.", 422));
                           } 

                           res.status(200).json(updatedPost);  
                        }
                        catch(err)
                        {
                           return next(new HttpError(err));
                        }
}



//************ Delete Post***********
// DELET: api/posts/:id
const deletePost = async (req, res, next) => {
                          try
                          {
                              const postId = req.params.id;
  
                              if(!postId)
                              {
                                 return next(new HttpError("Post Unavailable.",400));
                              }
  
                              const post = await Post.findById(postId);
                              const filename = post?.thumbnail;
                              
                              if(req.user.id == post.creator)
                              {  
                                 fs.unlink(path.join(__dirname +'/server/', '..', 'uploads', filename), async (err)=> {
                                    if(err)
                                    {
                                      return next(new HttpError(err));
                                    }
                                 
                                 });
                                 
                                 await Post.findByIdAndDelete(postId);
     
                                 const currentUser = await User.findById(req.user.id);
                                 const userPostCount = currentUser?.posts - 1;
     
                                 await User.findByIdAndUpdate(req.user.id,{posts: userPostCount});
                             
                                 res.json(`Post ${postId} deleted successfully`);
                              }
                              else
                              {
                                 return next(new HttpError("Post can't be deleted.", 422));
                              }
                          }
                          catch(err)
                          {
                              return next(new HttpError(err));
                          }
}

export { createPost, getPosts, getPost, getPostCategory, getPostUser, editPost, deletePost }