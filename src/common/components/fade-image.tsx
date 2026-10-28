"use client";

import { useState, type ComponentProps, type ReactElement } from "react";

import Image from "next/image";

import { cn } from "@common/utils/cn.util";

export function FadeImage({ alt, className, onLoad, placeholder = "empty", src, ...props }: ComponentProps<typeof Image>): ReactElement {
  const [loadedSrc, setLoadedSrc] = useState<ComponentProps<typeof Image>["src"]>();

  const isLoaded = loadedSrc === src;

  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      placeholder={placeholder}
      className={cn("transition-opacity duration-200 motion-reduce:transition-none", isLoaded ? "opacity-100" : "opacity-0", className)}
      onLoad={(event) => {
        setLoadedSrc(src);
        onLoad?.(event);
      }}
    />
  );
}
