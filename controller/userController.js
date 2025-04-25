
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

import HttpError from '../models/errorModel.js';

import User from '../models/userModel.js';

import fs from "fs";
import path from 'path';
import { __dirname, __filename } from '../config.js';          //config for __dirname
import { v4 as uuidv4 } from "uuid";

import { error } from 'console';



//************ Register New User ***********
// POST: api/users/register
const registerUser = async ( req, res, next) => {
                             try
                             { 
                                const { username, password, passwordconfirm, email, registercode } = req.body;
                                console.log(username);
                                console.log(password);
                                console.log(email);

                                if(!username || !password || !email)
                                {
                                   return next(new HttpError("Fill in all fields.", 422)); 
                                }

                                const newEmail = email.toLowerCase();
                                const emailExits = await User.findOne({email:newEmail});

                                if(emailExits)
                                {
                                    return next(new HttpError("Email already exits.", 422));
                                }

                                if((password.trim()).length < 5)
                                {
                                    return next(new HttpError("Password should be at least 5 characters."), 422);
                                }

                                if(password!=passwordconfirm)
                                {
                                    return next(new HttpError("Passwords not match.", 422));
                                }

                                if(registercode!="admincode")
                                {
                                    return next( new HttpError("Register code not provided.", 422));
                                }
                                
                                console.log("registering new user...");

                                const salt = await bcrypt.genSalt();
                                const hashedPassword = await bcrypt.hash(password.toString(), salt);
                                const newUser = await new User   (
                                                                   {  username: username, 
                                                                      password: hashedPassword,
                                                                      email: newEmail
                                                                   }
                                                                 );
                                newUser.save();

                                res.status(200).json(`New User ${newUser.email} registered`);

                             }
                             catch(error) 
                             { 
                                return next(new HttpError("User registration failed.", 422));
                             }
}


//************ Login User ***********
// POST: api/users/login
const loginUser = async ( req, res, next) => {
                          try
                          {
                               const {email, password } = req.body;
                               
                               if(!email || !password)
                               {
                                  return next( new HttpError("Fill in all fields.", 422));
                               }

                               const lowerEmail = email.toLowerCase();

                               const user = await User.findOne({ email: lowerEmail});

                               if(!user)
                               {
                                 return next(new HttpError("Invalid email.", 422));
                               }

                               const isPasswordValid= await bcrypt.compare(password, user.password);

                               if(!isPasswordValid)
                               {
                                 return next( new HttpError("Invalid password.", 422));
                               }
                               
                               const maxExpiresIn = 60 * 60 * 24 * 1;

                               const {_id: id, username: name } = user;
                               
                               const token = jwt.sign( { id, name}, process.env.JWT_SECRET,{ expiresIn: maxExpiresIn });    
                              
                               res.status(200).json({token, id, name});      
                          }
                          catch(error)
                          {
                               return next(new HttpError("Login failed."),422);
                          }
}


//************ Profile of User ***********
// GET: api/users/:id
const getUser = async ( req, res, next) => {
                        try
                        {
                            const { id } = req.params;
                            const user = await User.findById(id).select('-password');   //not include password
                            
                            if(!user)
                            {
                                return next(new HttpError("User not found.", 404));
                            }

                            res.status(200).json(user);
                        }
                        catch(error)
                        {
                            return next( new HttpError(error));
                        }
}

//************ Get Authors ***********
// GET: api/users/
const getAuthors = async ( req, res, next) => {
                           try 
                           {
                              const authors = await User.find().select('-password');

                              res.json(authors);
                           }
                           catch(error)
                           {
                              return next(new HttpError(error));
                           }
}



//************ Change User Profile (Avatar picture) ***********
// POST: api/users/change-avatar
const changeAvatar = async ( req, res, next) => {
                             try 
                             {
                                if(!req.files.avatar)
                                {
                                    return next(HttpError("Please choose an image.", 422));
                                }

                                const user = await User.findById(req.user.id);

                                if(user.avatar)
                                {
                                    fs.unlink(path.join(__dirname +'/server/', '..', 'uploads', user.avatar), (err)=> {
                                       if(err)
                                       {
                                          return next(new HttpError(err));
                                       }
                                    });
                                }
                                
                                const { avatar } = req.files;

                                if(avatar.size > 5000000)
                                {
                                    return next(new HttpError("Picture is too big. Should be less than 500kb"), 422);
                                }
                                 
                                let filename;
                                filename = avatar.name;
                                let splittedFilename = filename.split('.');
                                let newFilename = splittedFilename[0] + uuidv4() + '.' + splittedFilename[splittedFilename.length - 1];

                                avatar.mv(path.join(__dirname + '/server/', '..', 'uploads', newFilename), async (err)=> {
                                       if(err)
                                       {
                                          return next(new HttpError(err));
                                       }
                                });

                                const updatedAvatar = await User.findByIdAndUpdate(req.user.id,{ avatar: newFilename}, { new: true} );

                                if(!updatedAvatar)
                                {
                                   return next(new HttpError("Avatar failed to update.", 422));
                                } 

                                res.status(200).json(updatedAvatar);   
                             }
                             catch(error)
                             {
                                return next(new HttpError(error));
                             }
}


//************ Edit User Details (from Profile) ***********
// POST: api/users/edit-user
const editUser =  async ( req, res, next) => {
                          try 
                          {
                             const { username, currentPassword, newPassword, confirmNewPassword, email } = req.body;

                             if(!username || !currentPassword || !newPassword || !confirmNewPassword || !email)
                             {
                                return next(new HttpError("Fill in all fields.", 422));
                             }
                             
                             const user = await User.findById(req.user.id);            //req.user.id from authMiddlware 

                             if(!user)
                             {
                                return next(new HttpError("User not found.", 403));
                             }

                             const emailExist = await User.findOne({email});
 
                             if(emailExist && (emailExist._id != req.user.id))
                             {
                                return next(new HttpError("Email not belong to you.", 422));
                             }

                             if(newPassword !== confirmNewPassword)
                             {
                                return next(new HttpError("New password and confirm new password not match.",422));
                             }
                             
                             const validCurrentPassword = await bcrypt.compare(currentPassword, user.password);

                             if(!validCurrentPassword)
                             {
                                return next(new HttpError("Invalid current password.",422));
                             }

                             const salt = await bcrypt.genSalt();
                             const hashedpassword = await bcrypt.hash(newPassword, salt);
                          

                             const newInfo = await User.findByIdAndUpdate(req.user.id, {username, password: hashedpassword, email}, {new: true});

                             res.status(200).json(newInfo);
                          }
                          catch(error)
                          {
                             return next(new HttpError(error));
                          }
}



export { registerUser, loginUser, getUser, changeAvatar, editUser, getAuthors }

