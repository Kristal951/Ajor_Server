import express from 'express'
import { createUserAppPin, getCurrentUser, registerUser, verifyUserPin } from '../controllers/User.js'
const router = express.Router()

router.post('/register', registerUser)
router.post('/create-pin', createUserAppPin)
router.post('/verify-pin', verifyUserPin)
router.get('/me', getCurrentUser)

export default router