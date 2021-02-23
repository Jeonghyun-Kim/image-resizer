import React from 'react';
import styled from 'styled-components';
import NextImage from 'next/image';
import isDecimal from 'validator/lib/isDecimal';
import Button from '@material-ui/core/Button';
import Text from '@material-ui/core/Typography';
import Input from '@material-ui/core/TextField';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

// importing components
import { Head } from '@components/core';

// importing libraries

const Root = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const sizeOf: (
  url: string,
) => Promise<{ width: number; height: number }> = async (url) => {
  return await new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.width, height: image.height });
    };
    image.src = url;
  });
};

const Home: React.FC = () => {
  const [size, setSize] = React.useState<{ width: string; height: string }>({
    width: '',
    height: '',
  });
  const [fit, setFit] = React.useState<string>('cover');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [imageFile, setImageFile] = React.useState<{
    file: File;
    filename: string;
    src: string;
    size: {
      width: number;
      height: number;
    };
  } | null>(null);
  // const [inputSize, setInputSize] = React.useState<{ width: number; height: number } | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null);
  const downloadButtonRef = React.useRef<HTMLAnchorElement>(null);

  const handleImageChange = (file: File) => {
    if (!file) return;

    if (file.size >= 4.7 * 1024 * 1024) {
      return window.alert('파일 사이즈 초과');
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dimensions = await sizeOf(reader.result as string);

      setImageFile({
        file,
        filename: file.name,
        src: reader.result as string,
        size: {
          width: dimensions.width,
          height: dimensions.height,
        },
      });
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
      formData.append('fit', fit);
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
        downloadButtonRef.current.download = `${imageFile.filename}_${size.width}x${size.height}_${fit}.jpg`;
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
        <h1 className="text-3xl mb-4">Image resizer</h1>
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
        <div className="my-2">
          <h2 className="text-xl">원본 이미지 정보</h2>
          <div className="flex space-x-4 h-64">
            {imageFile ? (
              <NextImage
                src={imageFile.src}
                className="bg-gray-500"
                width={256}
                height={256}
                objectFit="contain"
                loading="eager"
              />
            ) : (
              <div
                className="w-64 h-64 bg-gray-500 flex justify-center items-center text-white cursor-pointer"
                onClick={() => inputRef.current?.click()}
              >
                이미지 업로드
              </div>
            )}
            <div>
              <Text>가로: {imageFile ? imageFile.size.width : 'null'}</Text>
              <Text>세로: {imageFile ? imageFile.size.height : 'null'}</Text>
            </div>
          </div>
        </div>
        <div className="my-2 space-x-2">
          <h2 className="text-xl mb-2">사이즈</h2>
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
        <div className="my-2 space-x-2">
          <h2 className="text-xl mb-2">핏</h2>
          <Select
            value={fit}
            onChange={(e) => {
              setFit(e.target.value as string);
            }}
          >
            <MenuItem value="cover">cover</MenuItem>
            <MenuItem value="contain">contain</MenuItem>
            <MenuItem value="fill">fill</MenuItem>
            <MenuItem value="inside">inside</MenuItem>
            <MenuItem value="outside">outside</MenuItem>
          </Select>
        </div>
        <div className="my-4">
          <Button
            variant="contained"
            color="primary"
            onClick={() => convertImage()}
          >
            send
          </Button>
        </div>
        <div className="my-4">
          <Text>{loading && '로딩중...'}</Text>
        </div>
      </Root>
    </>
  );
};

export default Home;
