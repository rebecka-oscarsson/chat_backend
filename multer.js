const multer = require("multer");
const path = require('path');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '/public/uploads/'));
  },
  filename: function (req, file, cb) {
    const filename = `${Date.now()}-${file.originalname}`;
    cb(null, filename);
  },
});
var upload = multer({ storage: storage }).single("avatar"); //avatar = namn på formulärfältet
module.exports = upload;
