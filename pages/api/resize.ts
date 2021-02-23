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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  file: any;
}

const handler: (
  req: RequestWithFile,
  res: NextApiResponse,
) => Promise<void> = async (req, res) => {
  if (req.method === 'POST') {
    await runMiddleware(req, res, upload.single('image'));

    if (!req.file) return res.status(400).send('empty image');

    const { width, height, quality, fit } = req.body;

    if (!width && !height) {
      return res.status(400).send('missing width and height');
    }

    if (
      (width.length && !isDecimal(width)) ||
      (height.length && !isDecimal(height))
    ) {
      return res.status(400).send('non-decimal width or height');
    }

    if (
      quality &&
      (!isDecimal(quality) || Number(quality) > 100 || Number(quality) < 1)
    ) {
      return res.status(400).send('invalid quality value (1 - 100)');
    }

    if (!fit) {
      return res.status(400).send('missing fit');
    }

    if (
      fit !== 'cover' &&
      fit !== 'contain' &&
      fit !== 'fill' &&
      fit !== 'inside' &&
      fit !== 'outside'
    ) {
      return res.status(400).send('invalid fit');
    }

    const imageBuffer = req.file.buffer as Buffer;

    const resizedBuffer = await sharp(imageBuffer)
      .clone()
      .resize({
        width: width ? Number(width) : undefined,
        height: height ? Number(height) : undefined,
        fit,
      })
      .jpeg({
        quality: quality ? Number(quality) : 75,
        chromaSubsampling: '4:4:4',
      })
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
