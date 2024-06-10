import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
const secretKey = process.env.JWT_SECRET_KEY;

export const verifyToken = (req, res, next) => {
    
  const token = req.headers.authorization;
  
  //  console.log("header",req.headers)
  if (token) {
  
// console.log("token is",token);
    jwt.verify(token, "shivam", (err, decodedToken) => {
      if (err) {
        // console.log("not verified",decodedToken);
        res.status(401).json({ error: 'Unauthorized' });
      } else {
        req.user = decodedToken;
       console.log("decode token is",decodedToken);
    
      
        next();
      }
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

