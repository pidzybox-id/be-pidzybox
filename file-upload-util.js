import fs from 'fs';
import axios from 'axios';

export const uploadFile = async (file) => {
  const fileStream = fs.createReadStream(file.path);
  const UniqueFileName = `${Date.now()}-${file.filename}-${file.originalname}`;

  const response = await axios.put(
    `https://sg.storage.bunnycdn.com/dev-pidzybbox/${UniqueFileName}`, 
    fileStream, {
        headers:{
            AccessKey: '5b54722a-e4f7-4140-b3c9416495c7-13de-46a2',
        }
    }
  );
  if (response.status === 201 || response.status === 200) {
    return `https://dev-pidzybbox.b-cdn.net/${UniqueFileName}`;
  } else {
    console.error(`BunnyCDN upload failed with status ${response.status}:`, response.data);
    return false; // Indicates failure for this specific file
  }
}

export const uploadMultipleFiles = async (files) => {
    // Use Promise.all to run all uploads concurrently for speed
    const uploadPromises = files.map(file => uploadFile(file));

    // Wait for all promises to settle (resolve or reject)
    const results = await Promise.all(uploadPromises);

    // Filter out any failed uploads (where uploadFile returned false)
    const successfulUrls = results.filter(url => url);

    // Check if any files failed
    if (successfulUrls.length !== files.length) {
        // You might want to log which ones failed here
        console.warn(`${files.length - successfulUrls.length} file(s) failed to upload.`);
    }

    // Return the array of successfully uploaded URLs
    return successfulUrls;
}