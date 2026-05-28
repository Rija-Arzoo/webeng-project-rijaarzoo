import jwt from 'jsonwebtoken';
import { jwtSecret, jwtExpire } from '../config/index.js';

export const signAuthToken = (user) =>
  jwt.sign(
    { userId: user._id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: jwtExpire }
  );
