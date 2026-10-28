"use client";

import type { ComponentProps, ReactElement } from "react";

import type Image from "next/image";

import { FadeImage } from "@common/components/fade-image";

export function LogoImage({ alt, style, ...props }: ComponentProps<typeof Image>): ReactElement {
  return <FadeImage {...props} alt={alt} style={{ objectFit: "contain", ...style }} />;
}
