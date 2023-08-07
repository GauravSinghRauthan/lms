import { Schema,model } from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'

const userSchema = new Schema({
    fullName: {
        type: String,
        minLength: [5,"name must be at least 5 character"],
        maxLength: [50, "name must be more than 50 characters"],
        required: true,
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, 'name is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    role:{
        type: String,
        enum: ['USER','ADMIN'],
        default: 'USER'
    },
    password:{
        type: String,
        required: [true, 'password is required'],
        minLength: [8, 'password must be 8 character'],
        select: false
    },
    avatar: {
        public_id:{
            type: String
        },
        secure_url:{
            type: String
        }
    },
    forgotPasswordToken: String,
    forgetPasswordExpairy: Date
},{
    timestamps: true
})

userSchema.pre('save', async function(next){
    if (!this.isModified('password')){
        return next();
    }
    this.password =await bcrypt.hash(this.password, 10)
})

userSchema.methods = {
    generateJWTToken:async function(){
      return await jwt.sign(
        {id: this._id,email: this.email, subscription: this.subscription, role: this.role},
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRY,
        }
      )  
    },
    comparePassword: async function(plainTextPassword){
        return await bcrypt.compare(plainTextPassword,this.password)
    },
    generatePasswordReset: async function (){
        const resToken = crypto.randomBytes(20).totring('hex');

        this.forgotPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')
        ;
        this.forgetPasswordExpairy = Data.now() + 15 * 60 * 1000;

        return resetToken;
    }
 
    
}

const User = model('User',userSchema)


export default User;