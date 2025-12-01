import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const uploadFile = async (file) => {
  const fileStream = fs.createReadStream(file.path);
  const UniqueFileName = `${Date.now()}-${file.filename}-${file.originalname}`;

  try {
    const res = await axios.put(
      `https://sg.storage.bunnycdn.com/dev-pidzybbox/${UniqueFileName}`,
      fileStream,
      {
        headers: {
          AccessKey: process.env.BUNNYCDN_API_KEY,
          "Content-Type": "application/octet-stream",
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    // Success
    if (res.status === 201 || res.status === 200) {
      return `https://dev-pidzybbox.b-cdn.net/${UniqueFileName}`;
    }

    console.error(
      `BunnyCDN upload returned unexpected status ${res.status}:`,
      res.data
    );
    return false;

  } catch (err) {
    console.error(
      "Upload failed:",
      err.response?.status,
      err.response?.data || err.message
    );
    return false;
  }
};

export const uploadMultipleFiles = async (files) => {
  const uploadPromises = files.map((file) => uploadFile(file));
  const results = await Promise.all(uploadPromises);

  const successfulUrls = results.filter((url) => url);

  if (successfulUrls.length !== files.length) {
    console.warn(`${files.length - successfulUrls.length} file(s) failed to upload.`);
  }

  return successfulUrls;
};