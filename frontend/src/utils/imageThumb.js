import { optimizeCloudinaryImage } from "./optimizeCloudinaryImage";

// Cloudinary URL transformation - small fast thumbnails for cards
export const thumb = (url, w = 500, h = 320) => {
  if (!url || !url.includes("/upload/")) return url;
  return optimizeCloudinaryImage(url, w, h);
};
