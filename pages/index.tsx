import React from 'react';
import styled from 'styled-components';
import isDecimal from 'validator/lib/isDecimal';
import Button from '@material-ui/core/Button';
import Text from '@material-ui/core/Typography';
import Input from '@material-ui/core/TextField';

// importing components
import { Head } from '@components/core';

// importing libraries

const Root = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`;

const Home: React.FC = () => {
  const [size, setSize] = React.useState<{ width: string; height: string }>({
    width: '',
    height: '',
  });
  const [loading, setLoading] = React.useState<boolean>(false);
  const [imageFile, setImageFile] = React.useState<{
    file: File;
    filename: string;
  } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const downloadButtonRef = React.useRef<HTMLAnchorElement>(null);

  const handleImageChange = (file: File) => {
    if (!file) return;

    if (file.size >= 4.7 * 1024 * 1024) {
      return window.alert('파일 사이즈 초과');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageFile({ file, filename: file.name });
    };

    reader.readAsDataURL(file);
  };

  const convertImage = async () => {
    setLoading(true);
    try {
      if (!imageFile) throw new Error('먼저 이미지 파일을 선택해주세요.');
      if (!isDecimal(size.width))
        throw new Error('가로길이가 올바르지 않습니다.');
      if (!isDecimal(size.height))
        throw new Error('세로길이가 올바르지 않습니다.');

      const formData = new FormData();
      formData.append('image', imageFile.file);
      formData.append('width', size.width);
      formData.append('height', size.height);
      const response = await fetch('/api/resize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      if (downloadButtonRef.current) {
        const data = await response.blob();

        const url = window.URL.createObjectURL(data);
        downloadButtonRef.current.href = url;
        downloadButtonRef.current.download = `${imageFile.filename}.jpg`;
        downloadButtonRef.current.click();
        window.URL.revokeObjectURL(url);

        setImageFile(null);
        setSize({ width: '', height: '' });
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    } catch (err) {
      console.log(err);
      window.alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Kay&apos;s Image Resizer</title>
      </Head>
      <Root>
        <div>
          <a ref={downloadButtonRef} className="hidden" />
          <input
            ref={inputRef}
            type="file"
            accept="image/x-png,image/gif,image/jpeg, image/png"
            onChange={(e) => {
              e.preventDefault();
              if (e.target.files) {
                const file = e.target.files[0];
                handleImageChange(file);
              }
            }}
          />
        </div>
        <div className="my-2 space-x-2">
          <Input
            variant="outlined"
            size="small"
            label="가로길이"
            autoComplete="off"
            value={size.width}
            onChange={(e) =>
              setSize((prevSize) => ({
                ...prevSize,
                width: e.target.value,
              }))
            }
          />
          <Input
            variant="outlined"
            size="small"
            label="세로길이"
            autoComplete="off"
            value={size.height}
            onChange={(e) =>
              setSize((prevSize) => ({
                ...prevSize,
                height: e.target.value,
              }))
            }
          />
        </div>
        <div>
          <Button
            variant="contained"
            color="primary"
            onClick={() => convertImage()}
          >
            send
          </Button>
        </div>
        <Text>{loading && 'loading...'}</Text>
      </Root>
    </>
  );
};

export default Home;
