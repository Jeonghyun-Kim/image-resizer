import isDecimal from 'validator/lib/isDecimal';

type ResizeConfig = {
  width: string;
  height: string;
  quality?: string;
  fit: string;
};

const validateResizeConfig: (config: ResizeConfig) => boolean = ({
  width,
  height,
  quality = '75',
  fit = 'cover',
}) => {
  if (!width && !height) {
    console.log('missing width and height');
    return false;
  }

  if (
    (width.length && !isDecimal(width)) ||
    (height.length && !isDecimal(height))
  ) {
    console.log('non-decimal width or height');
    return false;
  }

  if (!isDecimal(quality) || Number(quality) > 100 || Number(quality) < 1) {
    console.log('invalid quality value (1 - 100)');
    return false;
  }

  if (
    fit !== 'cover' &&
    fit !== 'contain' &&
    fit !== 'fill' &&
    fit !== 'inside' &&
    fit !== 'outside'
  ) {
    console.log('invalid fit');
    return false;
  }

  return true;
};

export default validateResizeConfig;
