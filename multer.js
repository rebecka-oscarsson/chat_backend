const multer = require("multer");
const path = require('path');
const fs = require("fs");
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsfolder = path.join(__dirname, '/uploads');
    fs.mkdirSync(uploadsfolder, { recursive: true })
    cb(null, uploadsfolder);
  },
  filename: function (req, file, cb) {
    const filename = `${Date.now()}-${file.originalname}`;
    cb(null, filename);
  },
});
var upload = multer({ storage: storage }).single("avatar"); //avatar = namn på formulärfältet
module.exports = upload;
