import multer from 'multer';

const fileFilter = (_req, file, cb) => {
  const allowed = ['image/png', 'image/jpeg', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PNG, JPEG, WebP`), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 10,
  },
});

const uploadMiddleware = upload.array('images', 10);

export default uploadMiddleware;
