import express from 'express'
import { protect } from '../middlewares/auth.js';

import { loginUser, registerUser, getUser, getPublishedImages } from './../controllers/userController.js';


const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)
userRouter.get('/data',protect, getUser)
userRouter.get('/published-images', getPublishedImages)

export default userRouter