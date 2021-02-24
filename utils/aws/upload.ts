import s3 from './s3';

const upload: (
  bucket: string,
  fileName: string,
  body: Buffer,
) => Promise<{
  ETag: string;
  VersionId: string;
  Location: string;
  key: string;
  Key: string;
  Bucket: string;
}> = async (bucket, fileName, body) => {
  return new Promise((resolve, reject) => {
    s3.upload(
      {
        Bucket: bucket,
        Key: fileName,
        Body: body,
        ACL: 'public-read',
      },
      (err, data) => {
        if (err) reject(err);
        else
          resolve(
            data as {
              ETag: string;
              VersionId: string;
              Location: string;
              key: string;
              Key: string;
              Bucket: string;
            },
          );
      },
    );
  });
};

export default upload;
