import sharp from "sharp";

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Convert a stored image into a bounded JPEG data URL for vision requests. */
export async function preprocessImageToDataUrl(input, options = {}) {
  const maxPixels = options.maxPixels ?? envNumber("IMAGE_MAX_PIXELS", 4_000_000);
  const quality = options.quality ?? envNumber("IMAGE_JPEG_QUALITY", 85);
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  const source = sharp(buffer, { failOn: "none" }).rotate();
  const metadata = await source.metadata();
  const pixels = (metadata.width || 1) * (metadata.height || 1);
  const pipeline = pixels > maxPixels
    ? source.resize({
      width: Math.max(1, Math.floor(Math.sqrt(maxPixels))),
      height: Math.max(1, Math.floor(Math.sqrt(maxPixels))),
      fit: "inside",
      withoutEnlargement: true,
    })
    : source;
  const output = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer({ resolveWithObject: true });
  return {
    dataUrl: `data:image/jpeg;base64,${output.data.toString("base64")}`,
    width: output.info.width,
    height: output.info.height,
    bytes: output.data.length,
  };
}
