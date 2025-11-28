import { BadRequestException } from '@nestjs/common';

export const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
    return cb(new BadRequestException('Only image files are allowed!'), false);
  }
  cb(null, true);
};

export const anyFileFilter = (req, file, cb) => {
  cb(null, true); // allow any
};
