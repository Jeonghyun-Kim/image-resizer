import { NextApiRequest, NextApiResponse } from 'next';

import withErrorHandler from '@utils/withErrorHandler';

const handler: (
  req: NextApiRequest,
  res: NextApiResponse,
) => Promise<void> = async (req, res) => {
  if (req.method === 'GET') {
    return res.send('hello');
  }

  res.statusCode = 404;
  throw new Error('Method not found.');
};

export default withErrorHandler(handler);
