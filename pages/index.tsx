import React from 'react';
import styled from 'styled-components';
import NextImage from 'next/image';
import isDecimal from 'validator/lib/isDecimal';
import Button from '@material-ui/core/Button';
import Text from '@material-ui/core/Typography';
import Input from '@material-ui/core/TextField';
import Slider from '@material-ui/core/Slider';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

// importing components
import { Head } from '@components/core';
import uploadImage from '@lib/uploadImage';

// importing libraries

const Root = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const MySelect = styled(Select)`
  .MuiSelect-outlined {
    width: 4rem;
    padding: 0.5rem 1rem;
  }
`;

type ImageFile = {
  file: File;
  filename: string;
  src: string;
  size: {
    width: number;
    height: number;
  };
};

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
  // TODO: add detailed progress info. (size test -> uploading, resizing ?)
  const [imageFile, setImageFile] = React.useState<ImageFile | null>(null);
  const [size, setSize] = React.useState<{ width: string; height: string }>({
    width: '',
    height: '',
  });
  const [fit, setFit] = React.useState<string>('cover');
  const [quality, setQuality] = React.useState<number>(75);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [targetName, setTargetName] = React.useState<string>('');

  const inputRef = React.useRef<HTMLInputElement>(null);
  const filenameInputRef = React.useRef<HTMLInputElement>(null);
  const downloadButtonRef = React.useRef<HTMLAnchorElement>(null);
  const awsFlag = React.useRef<boolean>(false);

  const handleImageChange: (file: File) => void = React.useCallback((file) => {
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
  }, []);

  const handleClear = React.useCallback(() => {
    setImageFile(null);
    setSize({ width: '', height: '' });
    setTargetName('');
    // setQuality(75);
    awsFlag.current = false;
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const convertImage: (
    imageFile: ImageFile | null,
    size: { width: string; height: string },
    quality: number,
    fit: string,
    targetName: string,
  ) => Promise<void> = React.useCallback(
    async (imageFile, size, quality, fit, targetName) => {
      setLoading(true);
      try {
        if (!imageFile) throw new Error('먼저 이미지 파일을 선택해주세요.');
        if (!size.width && !size.height)
          throw new Error('가로, 세로 중 최소 한 개는 입력해주세요.');
        if (size.width.length && !isDecimal(size.width))
          throw new Error('가로길이가 올바르지 않습니다.');
        if (size.height.length && !isDecimal(size.height))
          throw new Error('세로길이가 올바르지 않습니다.');

        const formData = new FormData();

        let response: Response;

        if (awsFlag.current === false) {
          formData.append('image', imageFile.file);
          formData.append('width', size.width);
          formData.append('height', size.height);
          formData.append('quality', String(quality));
          formData.append('fit', fit);
          response = await fetch('/api/resize', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(await response.text());
          }
        } else {
          const { key } = await uploadImage(imageFile.file, {
            onStart: () => {},
            onEnd: () => {},
          });

          response = await fetch('/api/resize/aws', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              key,
              width: size.width,
              height: size.height,
              quality: String(quality),
              fit,
            }),
          });
        }

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text);
        }

        if (downloadButtonRef.current) {
          const data = await response.blob();

          const url = window.URL.createObjectURL(data);
          downloadButtonRef.current.href = url;
          downloadButtonRef.current.download = targetName
            ? `${targetName}.jpg`
            : `${imageFile.filename.split('.').slice(0, -1).join('.')}_${
                size.width ||
                (
                  (Number(size.height) * imageFile.size.width) /
                  imageFile.size.height
                ).toFixed(0)
              }x${
                size.height ||
                (
                  (Number(size.width) * imageFile.size.height) /
                  imageFile.size.width
                ).toFixed(0)
              }_${fit}.jpg`;
          downloadButtonRef.current.click();
          window.URL.revokeObjectURL(url);

          handleClear();
        }
      } catch (err) {
        console.log(err);
        window.alert(err.message);
      } finally {
        setLoading(false);
      }
    },
    [handleClear],
  );

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
            onChange={async (e) => {
              e.preventDefault();
              if (e.target.files) {
                const file = e.target.files[0];

                if (!file) return;

                if (file.size >= 4.3 * 1000 * 1000) {
                  awsFlag.current = true;
                } else {
                  awsFlag.current = false;
                }

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
                className="bg-gray-500 cursor-pointer"
                width={256}
                height={256}
                objectFit="contain"
                loading="eager"
                onClick={() => inputRef.current?.click()}
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
              <Text>
                가로: {imageFile ? `${imageFile.size.width} px` : 'null'}
              </Text>
              <Text>
                세로: {imageFile ? `${imageFile.size.height} px` : 'null'}
              </Text>
            </div>
          </div>
        </div>
        <div className="my-2 space-x-2">
          <h2 className="text-xl mb-2">
            사이즈 (하나만 입력 시 원본 비율 유지)
          </h2>
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
          <h2 className="text-xl mb-2">퀄리티 (80 이하 권장): {quality}</h2>
          <div className="w-96">
            <Slider
              max={100}
              min={1}
              value={quality}
              // marks
              // getAriaValueText={(val) => String(val)}
              valueLabelDisplay="auto"
              onChange={(_, newValue) => setQuality(newValue as number)}
            />
          </div>
        </div>
        <div className="my-2 space-x-2">
          <h2 className="text-xl mb-2">핏</h2>
          <MySelect
            variant="outlined"
            autoWidth
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
          </MySelect>
        </div>
        <div className="my-2 space-x-2">
          <h2 className="text-xl mb-2">저장할 이름 (선택, 확장자 없이)</h2>
          <Input
            variant="outlined"
            InputProps={{ style: { width: '25rem' } }}
            size="small"
            label="파일명"
            placeholder={
              imageFile
                ? `${imageFile.filename.split('.').slice(0, -1).join('.')}_${
                    size.width ||
                    (
                      (Number(size.height) * imageFile.size.width) /
                      imageFile.size.height
                    ).toFixed(0)
                  }x${
                    size.height ||
                    (
                      (Number(size.width) * imageFile.size.height) /
                      imageFile.size.width
                    ).toFixed(0)
                  }_${fit}`
                : undefined
            }
            inputRef={filenameInputRef}
            autoComplete="off"
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
          />
        </div>
        <div className="my-4">
          <Button
            variant="contained"
            color="primary"
            disabled={loading}
            onClick={() =>
              convertImage(imageFile, size, quality, fit, targetName)
            }
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
