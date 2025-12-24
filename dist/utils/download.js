import axios from "axios";
import fs from "fs";
import path from "path";
export async function downloadWithHeaders(url, outputPath) {
    const dir = path.dirname(outputPath);
    await fs.promises.mkdir(dir, { recursive: true });
    const response = await axios.get(url, {
        responseType: "stream",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            Referer: "https://www.bilibili.com",
            Cookie: `SESSDATA=${process.env.SESSDATA || ""}`,
        },
    });
    const writer = fs.createWriteStream(outputPath);
    await new Promise((resolve, reject) => {
        response.data.pipe(writer);
        writer.on("finish", () => resolve());
        writer.on("error", reject);
    });
    console.log(`Downloaded ${url} to ${outputPath}`);
    return outputPath;
}
