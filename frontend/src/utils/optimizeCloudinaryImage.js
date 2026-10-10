export function optimizeCloudinaryImage(url, width = 960, height, cropToFill = false) {
  if (typeof url !== "string" || !url.includes("/image/upload/")) return url;

  const uploadMarker = "/image/upload/";
  const markerIndex = url.indexOf(uploadMarker) + uploadMarker.length;
  const prefix = url.slice(0, markerIndex);
  const remainder = url.slice(markerIndex);
  const firstSlash = remainder.indexOf("/");
  const firstSegment = firstSlash === -1 ? remainder : remainder.slice(0, firstSlash);
  const isTransformation = /^(?:w_|h_|c_|q_|f_|dpr_|g_|e_|ar_|fl_|t_|b_|r_)/.test(firstSegment);
  const path = isTransformation ? remainder.slice(firstSlash + 1) : remainder;
  const options = isTransformation ? firstSegment.split(",") : [];
  const oldWidth = Number(options.find((item) => item.startsWith("w_"))?.slice(2));
  const oldHeight = Number(options.find((item) => item.startsWith("h_"))?.slice(2));
  const targetWidth = Math.max(1, Math.round(width));
  const targetHeight = height
    ? Math.max(1, Math.round(height))
    : oldWidth > 0 && oldHeight > 0
      ? Math.max(1, Math.round((oldHeight * targetWidth) / oldWidth))
      : oldHeight || undefined;
  const preservedOptions = options.filter((item) =>
    !/^(?:w_|h_|q_|f_)/.test(item) && !(cropToFill && item.startsWith("c_"))
  );
  const transforms = [
    `w_${targetWidth}`,
    ...(targetHeight ? [`h_${targetHeight}`] : []),
    ...(cropToFill ? ["c_fill"] : []),
    ...preservedOptions,
    "q_auto",
    "f_auto",
  ];
  const queryIndex = path.search(/[?#]/);
  const imagePath = queryIndex === -1 ? path : path.slice(0, queryIndex);
  const suffix = queryIndex === -1 ? "" : path.slice(queryIndex);

  return `${prefix}${transforms.join(",")}/${imagePath}${suffix}`;
}

export function cloudinaryUrl(url, width) {
  return optimizeCloudinaryImage(url, width, width, true);
}

export function cloudinarySrcSet(url, widths = [280, 420, 560]) {
  if (typeof url !== "string" || !url.includes("/image/upload/")) return undefined;
  return widths
    .map((width) => `${cloudinaryUrl(url, width)} ${width}w`)
    .join(", ");
}
