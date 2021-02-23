import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import sharp from 'sharp';
import isDecimal from 'validator/lib/isDecimal';

import withErrorHandler from '@utils/withErrorHandler';
import runMiddleware from '@utils/runMiddleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

interface RequestWithFile extends NextApiRequest {
  file: any;
}

const handler: (
  req: RequestWithFile,
  res: NextApiResponse,
) => Promise<void> = async (req, res) => {
  if (req.method === 'POST') {
    await runMiddleware(req, res, upload.single('image'));

    if (!req.file) return res.status(400).send('empty image');

    const { width, height } = req.body;

    if (!width || !height) {
      return res.status(400).send('missing width, height');
    }

    if (!isDecimal(width) || !isDecimal(height))
      return res.status(400).send('non-decimal width or height');

    const imageBuffer = req.file.buffer as Buffer;

    const resizedBuffer = await sharp(imageBuffer)
      .clone()
      .resize({
        width: Number(width),
        height: Number(height),
        fit: 'cover',
      })
      .jpeg({ quality: 75 })
      .withMetadata()
      .toBuffer();
    // .toFile('./public/test/test.jpg');

    res.setHeader('Content-Type', 'image/jpeg');
    return res.send(resizedBuffer);
  }

  res.statusCode = 404;
  throw new Error('Method not found.');
};

export default withErrorHandler(handler);
