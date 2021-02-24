import { NextApiRequest, NextApiResponse } from 'next';

import withErrorHandler from '@utils/withErrorHandler';
import { getUploadUrl } from '@utils/aws';

const handler: (
  req: NextApiRequest,
  res: NextApiResponse,
) => Promise<void> = async (req, res) => {
  if (req.method === 'GET') {
    const { ext } = req.query;

    const data = await getUploadUrl(ext as string);

    return res.json(data);
  }

  res.statusCode = 404;
  throw new Error('Method not found.');
};

export default withErrorHandler(handler);
