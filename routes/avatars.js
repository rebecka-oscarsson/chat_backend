var express = require("express");var router = express.Router();
const upload = require("../multer");
const cors = require("cors");
router.use(cors());
const sharp = require("sharp");
const fs = require("fs");

router.post("/upload", upload, async (req, res) => {
  console.log(req.file)
  const newFilename = "small" + req.file.filename; //namn på liten bild
  const image = sharp(req.file.path);
  const metadata = await image.metadata();
  const widthToHeightRatio = metadata.width/metadata.height
  widthToHeightRatio > 1 ? image.resize({ width: 200 }) : image.resize({ height: 200 });
  await image.toFile("./uploads/" + newFilename);
  // const newImage = sharp("./uploads/" + newFilename);
  // const newMetadata = await newImage.metadata()
  // console.log("efter", newMetadata.width)
  fs.unlinkSync(req.file.path); //radera stor bild
  res.json({"filename": newFilename, "widthToHeightRatio": widthToHeightRatio});
});

module.exports = router;
