import mongoose from "mongoose";

mongoose.set('strictQuery',false)

const connectToDB = async ()=>{
    try{
        const {connection} =await mongoose.connect(process.env.MONGOODB_URL);
        if(connection){
            console.log(`database connected at ${connection.host}`)
        }
    }catch(err){
        console.log(err);
        process.exit(1)
    }
}

export default connectToDB;