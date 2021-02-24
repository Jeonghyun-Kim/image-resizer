import { config, S3 } from 'aws-sdk';

const keyId = process.env.AWS_KEY_ID;
const secretKey = process.env.AWS_SECRET;

if (!keyId || !secretKey) throw new Error('No credentials');

// Set the region (other credentials are in process.env)
config.update({ region: 'ap-northeast-2' });

// Create S3 service object
const s3 = new S3({
  accessKeyId: keyId,
  secretAccessKey: secretKey,
  apiVersion: '2006-03-01',
});

export default s3;
