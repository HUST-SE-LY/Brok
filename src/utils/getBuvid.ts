import { axiosInstance } from './axios';

export const getBuvid = async () => {
  const res = await axiosInstance.get(
    'https://api.bilibili.com/x/frontend/finger/spi',
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        Referer: 'https://www.bilibili.com',
        Cookie: `SESSDATA=${process.env.SESSDATA || ''};bili_jct=${
          process.env.CSRF || ''
        }`,
      },
    }
  );
  const { b_3, b_4 } = res.data?.data || {};
  return {
    buvid3: b_3 || '',
    buvid4: b_4 || '',
  };
};
