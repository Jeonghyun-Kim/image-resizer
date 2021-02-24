import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import sharp from 'sharp';

import withErrorHandler from '@utils/withErrorHandler';
import runMiddleware from '@utils/runMiddleware';
import { validateResizeConfig } from '@utils/validator';

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

    if (!validateResizeConfig({ width, height, quality, fit })) {
      return res.status(400).send('validation falied');
    }

    // TODO: make imageResizeUtils?
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
