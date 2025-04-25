 
import express from "express";
 
//use controller
import { createPost, getPosts, getPost, getPostCategory, getPostUser, editPost, deletePost } from '../controller/postController.js'


//use Middleware
import { authMiddleware } from "../middleware/authMiddleware.js";
 
const router = express.Router();

//router.method('web browser address', middleware(optional), method name(defined in Controller))
router.post('/', authMiddleware, createPost);    
router.get('/', getPosts);
router.get('/:id', getPost);
router.get('/categories/:category', getPostCategory);
router.get('/users/:id', getPostUser );
router.patch('/:id',authMiddleware,  editPost);
router.delete('/:id',authMiddleware, deletePost);



export { router as postRoutes};