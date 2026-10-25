"use client";

import type { ComponentProps, ReactElement } from "react";

import Image from "next/image";

export function LogoImage({ alt, blurDataURL, style, ...props }: ComponentProps<typeof Image>): ReactElement {
  const placeholder = blurDataURL?.startsWith("data:image/") ? (blurDataURL as `data:image/${string}`) : "empty";

  // Keep the PNG's proportions and alpha instead of Next's stretched blur SVG.
  return <Image {...props} alt={alt} placeholder={placeholder} style={{ objectFit: "contain", ...style }} />;
}
