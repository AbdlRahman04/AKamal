import NextImage, { type ImageProps } from "next/image";
import { publicPath } from "./public-path";

export default function PublicImage({ src, alt, ...props }: ImageProps) {
  return <NextImage {...props} alt={alt} src={typeof src === "string" ? publicPath(src) : src} />;
}
