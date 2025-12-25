import axios, { AxiosHeaders } from 'axios';
import { buvid3, buvid4 } from '..';

export const axiosInstance = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    Referer: 'https://www.bilibili.com',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const cookie = `SESSDATA=${process.env.SESSDATA || ''};bili_jct=${
    process.env.CSRF || ''
  };buvid3=${buvid3};buvid4=${buvid4}`;
  const h = config.headers as AxiosHeaders | Record<string, any> | undefined;
  if (h && typeof (h as any).set === 'function') {
    (h as AxiosHeaders).set('Cookie', cookie);
  } else {
    config.headers = {
      ...((h as Record<string, any>) || {}),
      Cookie: cookie,
    } as any;
  }
  return config;
});
