import path from "path";

import multer from "multer";

const upload = multer({
    dest: "uploads/",
    limits: { fileSize: 50 * 1024 * 1024}, //50mb insize max limit
    storage: multer.diskStorage({
        destination: "uploads/",
        filename: (_req, file, cb) =>{
            cb(null, file.originalname);
        }
    }),
    fileFilter: (_req,file, cb) =>{
        let ext = path.extname(file.originalname)

        if(
            ext !== ".jpg" &&
            ext !== ".jpg" &&
            ext !== ".jpg" &&
            ext !== ".jpg" &&
            ext !== ".mp4"
        ){
            cb(new Error(`unsupporte file type! ${ext}`), false);
            false;
        }

        cb(null, true)
    },

})

export default upload;