import AppError from "../utils/error.util.js";
import User from "../models/user.models.js"
import cloudinary from "cloudinary"
import fs from "fs/promises"
import crypto from "crypto"

const cookieOption = {
    maxAge: 7 * 24  * 60 * 60 * 1000 , // 7 days
    httpOnly: true,
    secure: true
}

const register = async (req,res)=>{
    try{
        const {fullName,email,password} = req.body

    if(!fullName || !email || !password){
        return next( new AppError('All fields are required', 400));
    }

    const userEcxists = await User.findOne({email});
    if(userEcxists){
        return next( new AppError('Email already exists', 400))
    }

    const user = await User.create({
        fullName,
        email,
        password,
        avatar:{
            public_id: email,
            secure_url: "https://th.bing.com/th/id/OIP.IhiqRWFamp-enjV2csKdzwHaE8?w=252&h=180&c=7&r=0&o=5&dpr=1.3&pid=1.7"
        }
    })

    if (!user) {
        return next(new AppError('User registration failed, please try again', 400))
    }

    //TODO: filw upload

    if (req.file) {
        try{
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder: 'lms',
                width: 250,
                height: 250,
                grvity: 'faces',
                crops: 'file'
            });

            if(result) {
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url

                // Remove file from server

                fs.rm(`upload/${req.file.filename}`)
            }
        }catch(e){
            return next(new AppError(e || 'file not uploaded, [lz try again',500))
        }
    }

    await user.save();
    user.password = undefined;

    const token = await user.generateJWTToken();

    res.cookie('token',token,cookieOption)

    res.status(201).json({
        success: true,
        message: 'User reqistered successfully',
        user
    })

    }catch(e){
        return next( new AppError(e.message, 400))
    }
}

const login =async (req,res)=>{
    try{
        const { email, password} = req.body;

    if(!email || !password){
        return next(new AppError("All fieled required" , 400))
    }

    const user =await User.findOne({email}).select('+password');
    if (!user || !user.comparePassword(password)){
        return next(new AppError('Email or password does not match',400))
    }

    const token = await user.generateJWTToken();
    user.password = undefined;
    res.cookie('token',token,cookieOption)

    res.status(201).json({
        success: true,
        message: 'User login successfully',
        user
    })
    }catch(e){
        return next( new AppError(e.message, 400))
    }
}

const logout = (req,res)=>{
    res.cookie('token',null,{
        secure: true,
        maxAge: 0,
        httpOnly: true
    })

    res.status(200).json(
        {
            success: true,
            message: 'User logged out successfully'
        }
    )
}

const getProfile =async (req,res)=>{
    try{
        const userId = req.user.id;
        const user = await User.findById(userId);

        res.status(200).json({
            success: true,
            message: 'iser details',
            user
        })
    } catch(e){
        return next( new AppError(e.message, 400))
    }
    
}

const forgotPassword = async (req,res) =>{
    const {email} = req.body;
    if(!email){
        return next(new AppError('Email not reqistered', 400))
    }

    const user = await User.findOne({email});
    if (!user) {
        return next(new AppError('Email not reqistered', 400))
    }

    const resetToken = await user.generatePasswordReset()

    await user.save();

    const resetPasswordURL = `${processenv.env.FRONTENT_URL}/reset-password/${resetToken}`;

    const subject = 'Reset Password';
    const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;

    try {
        await sendEmail(email, subject, message);

        res.status(200).json({
            success: true,
            message: `Reset password token has been sent to ${email} successfully`
        })
    } catch(e) {
        user.forgetPasswordExpairy = undefined;
        user.forgotPasswordToken = undefined;

        await user.save();
        return(new AppError(e.message, 500))
    }
}

const resetPassword = async (req,res) =>{
    const {resetToken} = req.params;

    const {password} =req.body;

    const forgotPasswordToken = crypto
    .create('sha256')
    .update(resetToken)
    .digest('hex')

    const user = await User.findOne({
        forgetPasswordExpairy: {$gt: Date.now},
        forgotPasswordToken
    })

    if (!user) {
        return next(
            new AppError('Token is invalid or expired, please try again',400)
        )
    }

    user.password = password;
    user.forgotPasswordToken = undefined;
    user.forgetPasswordExpairy = undefined

    user.save();

    res.status(200).json({
        success: true,
        message: 'password changes uccessfully!'
    })
}

const changePassword = async (req,res) =>{
    const { oldPassword,newPassword} = req.body;

    const {id} = req.user;

    if(!oldPassword || !newPassword){
        return next(
            new AppError('all fields are mandatory',400)
        ) 
    }

    const user = await User.findById(id).select('+password')

    if(!user) {
        return next(
            new AppError('user not found',400)
        ) 
    }

    const isPasswordValid = await user.comparePassword(oldPassword)

    if(!isPasswordValid) {
        return next(
            new AppError('invalid old password',400)
        ) 
    }

    user.password = newPassword;

    await user.save();

    user.password = undefined;

    res.status(200).json({
        success: true,
        message: 'password chnage successfully'
    })

    

}

const updateUser = async (req,res) =>{
    const {fullName} = req.body;
    const {id} = req.user.id;

    const user = await User.findById(id);

    if (!user) {
        return next(
            new AppError('User does not exist',400)
        ) 
    }

    if (req.fullName) {
        user.fullName = fullName
    }

    if (req.file) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
        try{
            const result = await cloudinary.v2.uploader.upload(req.file.path,{
                folder: 'lms',
                width: 250,
                height: 250,
                grvity: 'faces',
                crops: 'file'
            });

            if(result) {
                user.avatar.public_id = result.public_id;
                user.avatar.secure_url = result.secure_url

                // Remove file from server

                fs.rm(`upload/${req.file.filename}`)
            }
        }catch(e){
            return next(new AppError(e || 'file not uploaded, [lz try again',500))
        }

        


    }

    await user.save();
    res.status(200).json({
        success: true,
        message: 'password chnage successfully'
    })
    
}

export {
    register,
    login,
    logout,
    getProfile,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser
}

