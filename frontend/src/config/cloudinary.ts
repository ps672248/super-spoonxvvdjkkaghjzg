// Replace these with your actual Cloudinary config
export const CLOUDINARY_CONFIG = {
  cloudName: "YOUR_CLOUD_NAME",
  uploadPreset: "YOUR_UPLOAD_PRESET", // Use an unsigned preset for client-side uploads
  apiKey: "YOUR_API_KEY",
};

export const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
