import s3 from './s3';
import sha256 from 'sha256';
import { v4 as uuidv4 } from 'uuid';

const getUploadUrl: (
  extension?: string,
) => Promise<{
  url: string;
  fields: { [x: string]: string };
}> = async (extension) => {
  const bucketName = process.env.AWS_BUCKET_NAME;

  if (!bucketName)
    throw new Error(`Can't find AWS_BUCKET_NAME in environment variables.`);

  return new Promise((resolve, reject) => {
    s3.createPresignedPost(
      {
        Bucket: bucketName,
        Fields: {
          key: `${new Date().toISOString().split('T')[0]}/${sha256(uuidv4())}${
            extension ? `.${extension}` : ''
          }`,
        },
        Expires: 30,
        Conditions: [
          // { acl: 'public-read' },
          ['content-length-range', 0, 52428800],
        ],
      },
      (err, data) => {
        if (err) reject(err);
        else
          resolve({
            url: data.url,
            fields: {
              // acl: 'public-read',
              ...data.fields,
            },
          });
      },
    );
  });
};

export default getUploadUrl;
