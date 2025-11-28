import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

export const storage = diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // ensure uploads folder exists (we'll create on startup)
  },
  filename: (req, file, cb) => {
    const fileExt = extname(file.originalname);
    const safeName = `${Date.now()}-${uuidv4()}${fileExt}`;
    cb(null, safeName);
  },
});
