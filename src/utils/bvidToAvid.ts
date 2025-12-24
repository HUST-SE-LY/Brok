export function bvidToAvid(bvid: string) {
  const table = "fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF";
  const tr: Record<string, number> = {};
  
  // 构建字符到索引的映射
  for (let i = 0; i < 58; i++) {
    tr[table[i]] = i;
  }
  
  const s = [11, 10, 3, 8, 4, 6]; // 特定位置
  const xor = 177451812n;
  const add = 8728348608n;
  
  let r = 0n;
  for (let i = 0; i < 6; i++) {
    r += BigInt(tr[bvid[s[i]]]) * (58n ** BigInt(i));
  }
  
  return Number((r - add) ^ xor);
}