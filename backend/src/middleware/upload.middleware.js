const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudinary = require("../config/cloudinary");


const storage = new CloudinaryStorage({

  cloudinary: cloudinary,

  params: {

    folder: "roomslider",

    allowed_formats: [
      "jpg",
      "jpeg",
      "png",
      "webp"
    ],

    transformation: [
      {
        width: 1600,
        height: 1067,
        crop: "fill",
        gravity: "auto",
        quality: "auto:good",
        fetch_format: "auto",
      }
    ]

  },

});



const upload = multer({

  storage: storage,

  limits: {

    fileSize: 5 * 1024 * 1024,

  },

});



module.exports = upload;
