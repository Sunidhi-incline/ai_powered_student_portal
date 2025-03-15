import express from 'express';
import { signup, login } from '../Controllers/AuthControllers.js';
import { validateSignup, validateLogin } from '../Middleware/AuthValidation.js';

const router = express.Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);

export default router;
