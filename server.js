import dotenv from "dotenv";
dotenv.config();

import express  from "express";
import upload from "express-fileupload";
import cors from "cors";
import mongoose from "mongoose";

import { userRoutes } from "./routes/userRoutes.js";
import { postRoutes } from "./routes/postRoutes.js";

import { notFound, errorHandler } from  "./middleware/errorMiddleware.js";

import { __dirname, __filename } from './config.js';          //config for __dirname

const app = express();

app.use(express.json({extended: true}));
app.use(express.urlencoded({extended: true}));
app.use(cors({credentials: true, origin: "https://apartment-puoq.onrender.com"}));



app.use(upload());
//app.use('/uploads', express.static(__dirname + '/server/' + '/uploads'));
app.use('/uploads', express.static(__dirname + '/uploads'));

//Base URL  is  http://locasthost:5000/api
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

app.use(notFound);
app.use(errorHandler);

mongoose.connect(process.env.DB_URI).then(
                                            app.listen(process.env.PORT || 5000, () => console.log(`Server Started on port ${process.env.PORT}`))
 
                                         )
                                    .catch( 
                                            error=> {console.log(error)}
                                          );
