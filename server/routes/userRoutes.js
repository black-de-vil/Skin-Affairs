import express from "express";
import { getUser, loginUser, registerUser, getPublishedImages, toggleLikeImage } from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/data', protect, getUser);
userRouter.get('/published-images', getPublishedImages);
userRouter.post('/toggle-like-image', protect, toggleLikeImage);


export default userRouter;