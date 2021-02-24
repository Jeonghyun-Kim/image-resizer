import s3 from './s3';

const bucketName = process.env.AWS_BUCKET_NAME;
if (!bucketName) throw new Error('missing bucketName.');

type AWSObjectData = {
  AcceptRanges: string;
  LastModified: Date;
  ContentLength: number;
  ETag: string;
  VersionId: string;
  ContentType: string;
  Metadata: any;
  Body: Buffer;
};

const getObjectByKey: (key: string) => Promise<AWSObjectData> = async (key) => {
  const params = {
    Bucket: bucketName,
    Key: key,
  };

  return new Promise((resolve, reject) => {
    s3.getObject(params, (err, data) => {
      if (err) {
        console.error(
          '[getObjectByKey.ts] failed retrieving an object from aws s3.',
          err,
        );
        reject(err);
      }
      resolve(data as AWSObjectData);
    });
  });
};

export default getObjectByKey;
