import Course from "../models/course.models.js"
import AppError from "../utils/error.util.js"

const getAllCourses = async (req,res,next)=>{
    try{
        const courses = await Course.find().select('-lectures')

        res.status(200).json({
            success: true,
            message: 'All courses',
            Courses
        })
    } catch(err){
        return next(new AppError(err.message,404)) 
    }
    
}

const getLecturesByCoursId = (req,res)=>{
    
}

export {
    getAllCourses,
    getLecturesByCoursId
}