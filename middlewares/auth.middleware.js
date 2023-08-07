import AppError from "../utils/error.util.js";
import jwt from 'jsonwebtoken'

const isLoggedIn = async (req,res,next)=>{
    const { token } = req.cookies;
    
    if(!token) {
        return next(new AppError('unauthenticated, please login again', 400))
    }

    const userDetils = await jwt.verify(token,process.env.JWT_SECRET);
    req.user = userDetils;

    next();
}

export {
    isLoggedIn
}