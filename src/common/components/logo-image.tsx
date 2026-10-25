"use client";

import type { ComponentProps, ReactElement } from "react";

import Image from "next/image";

export function LogoImage({ alt, blurDataURL, style, ...props }: ComponentProps<typeof Image>): ReactElement {
  return (
    <Image {...props} alt={alt} placeholder={blurDataURL ? "blur" : "empty"} blurDataURL={blurDataURL} style={{ objectFit: "contain", ...style }} />
  );
}
