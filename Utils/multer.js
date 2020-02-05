const multer = require('multer'),
  path = require('path'),
  maxSize = 2 * 1024 * 1024,
  filetypes = /jpg|png|jpeg/;

var imageStorage = multer.diskStorage({
  destination: path.join(`${__dirname}./../Public/Image/`),
  filename(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

var iconStorage = multer.diskStorage({
  destination: path.join(`${__dirname}./../Public/Icon/`),
  filename(req, file, cb) {
    cb(null, `icon-${Date.now()}${path.extname(file.originalname)}`);
  }
});

module.exports.uploadMenuImages = multer({
  storage: imageStorage,
  limits: { fileSize: maxSize },
  fileFilter(req, file, cb) {
    var mimetype = filetypes.test(file.mimetype);
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    return cb(`Error: File upload only supports the following filetypes - ${filetypes}`);
  }
}).array('image', 10);

module.exports.uploadRestaurantImage = multer({
  storage: imageStorage,
  limits: { fileSize: maxSize },
  fileFilter(req, file, cb) {
    var mimetype = filetypes.test(file.mimetype);
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    return cb(`Error: File upload only supports the following filetypes - ${filetypes}`);
  }
}).single('image');

module.exports.uploadCategoryIcon = multer({
  storage: iconStorage,
  limits: { fileSize: maxSize },
  fileFilter(req, file, cb) {
    var mimetype = filetypes.test(file.mimetype);
    var extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    return cb(`Error: File upload only supports the following filetypes - ${filetypes}`);
  }
}).single('icon');
