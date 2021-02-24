import fetcher from '@lib/fetcher';

const uploadImage: (
  file: File,
  callbacks?: { onStart?: () => void; onEnd?: () => void },
) => Promise<{ key: string }> = async (file, { onStart, onEnd } = {}) => {
  if (onStart) onStart();

  const { url, fields } = await fetcher(
    `/api/aws-url?ext=${file.name.split('.').slice(-1)[0]}`,
  );

  const formData = new FormData();

  Object.entries({ ...fields, file }).forEach(([key, value]) => {
    formData.append(key, value as string | Blob);
  });

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const resBody = await response.json();

    if (process.env.NODE_ENV === 'development') {
      console.log('[uploadImage.ts] AWS Upload Failed.', resBody);
    }

    throw new Error('AWS Upload Failed.');
  }

  if (onEnd) onEnd();

  return { key: fields.key };
};

export default uploadImage;
