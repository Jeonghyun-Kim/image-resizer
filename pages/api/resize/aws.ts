import { NextApiRequest, NextApiResponse } from 'next';
import sharp from 'sharp';

import withErrorHandler from '@utils/withErrorHandler';
import { getObjectByKey } from '@utils/aws';
import { validateResizeConfig } from '@utils/validator';

const handler: (
  req: NextApiRequest,
  res: NextApiResponse,
) => Promise<void> = async (req, res) => {
  if (req.method === 'POST') {
    const { key, width, height, quality, fit } = req.body;

    if (!key) return res.status(400).send('missing key.');
    // TODO: do more validations (key related)

    if (!validateResizeConfig({ width, height, quality, fit })) {
      return res.status(400).send('validation falied');
    }

    const data = await getObjectByKey(key);

    // TODO: make imageResizeUtils?
    const imageBuffer = data.Body;

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

    res.setHeader('Content-Type', 'image/jpeg');
    return res.send(resizedBuffer);
  }

  res.statusCode = 404;
  throw new Error('Method not found.');
};

export default withErrorHandler(handler);
