import Express  from "express";
import cors from "cors"
import cookieParser from "cookie-parser";
import router from "./routes/user.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";
const app = Express();

app.use(Express.json())

app.use(cookieParser())

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true
}))



app.use('/ping',(req,res)=>{
    res.send('Pong')
})

app.use('/api/v1/user',router)

app.all('*',(req,res)=>{
    res.send('OOPs !! no file found')
})

app.use(errorMiddleware);

export default  app;
