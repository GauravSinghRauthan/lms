import { Router } from "express";
import { getAllCourses, getLecturesByCoursId } from "../controllers/coures.controller";

const router = Router()

router.get('/',getAllCourses)
router.get('/:id',getLecturesByCoursId)