// Cloudinary URL transformation - small fast thumbnails for cards
export const thumb = (url, w = 500, h = 320) => {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/w_${w},h_${h},c_fill,q_auto,f_auto/`);
};
