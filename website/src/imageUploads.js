const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const multer = require('multer');

const uploadDirectory = path.join(__dirname, '..', 'public', 'uploads', 'library');
const allowedTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const receiveImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (!allowedTypes[file.mimetype]) {
      const error = new Error('Choose a JPEG, PNG, or WebP image.');
      error.code = 'INVALID_IMAGE_TYPE';
      return callback(error);
    }
    return callback(null, true);
  }
}).single('image');

function handleImageUpload(req, res, next) {
  receiveImage(req, res, error => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      req.imageUploadError = 'Image must be 5 MB or smaller.';
      return next();
    }
    if (error instanceof multer.MulterError) {
      req.imageUploadError = 'Upload one image using the image field.';
      return next();
    }
    if (error.code === 'INVALID_IMAGE_TYPE') {
      req.imageUploadError = error.message;
      return next();
    }
    return next(error);
  });
}

function imageExtension(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpg';
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'png';
  }
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  return null;
}

function uploadedImageError(file) {
  if (file && !imageExtension(file.buffer)) {
    return 'The uploaded file is not a valid JPEG, PNG, or WebP image.';
  }
  return null;
}

async function saveUploadedImage(file) {
  if (!file) return null;
  const extension = imageExtension(file.buffer);
  if (!extension) {
    const error = new Error('The uploaded file is not a valid JPEG, PNG, or WebP image.');
    error.code = 'INVALID_IMAGE_CONTENT';
    throw error;
  }
  await fs.mkdir(uploadDirectory, { recursive: true });
  const filename = `${crypto.randomUUID()}.${extension}`;
  await fs.writeFile(path.join(uploadDirectory, filename), file.buffer, { flag: 'wx' });
  return filename;
}

async function removeUploadedImage(filename) {
  if (!filename) return;
  if (!/^[0-9a-f-]{36}\.(?:jpg|png|webp)$/i.test(filename)) {
    throw new Error('Refusing to remove an image with an invalid stored filename.');
  }
  try {
    await fs.unlink(path.join(uploadDirectory, filename));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

module.exports = {
  handleImageUpload,
  uploadedImageError,
  saveUploadedImage,
  removeUploadedImage
};
