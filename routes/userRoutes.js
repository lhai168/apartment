
import express from "express";
 
//use controller
import { registerUser, loginUser, getUser, changeAvatar, editUser, getAuthors } from '../controller/userController.js'

//use Middleware
import { authMiddleware } from "../middleware/authMiddleware.js";


const router = express.Router();


router.post('/register', registerUser);     
router.post('/login', loginUser );     
router.get('/:id', getUser );     
router.get('/', getAuthors);     
router.post('/change-avatar', authMiddleware, changeAvatar );     
router.patch('/edit-user',authMiddleware, editUser );     
 

export { router as userRoutes};