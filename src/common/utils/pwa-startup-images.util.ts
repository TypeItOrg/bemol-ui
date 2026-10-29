const IPHONE_SCREENS = [
  [320, 568, 2],
  [375, 667, 2],
  [414, 736, 3],
  [375, 812, 3],
  [414, 896, 2],
  [414, 896, 3],
  [390, 844, 3],
  [428, 926, 3],
  [393, 852, 3],
  [430, 932, 3],
  [402, 874, 3],
  [420, 912, 3],
  [440, 956, 3],
] as const;

export const IPHONE_STARTUP_IMAGES = IPHONE_SCREENS.flatMap(([width, height, scale]) => {
  const media = `screen and (device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${scale})`;

  return [
    {
      url: `/brand/startup/${width * scale}x${height * scale}.png`,
      media: `${media} and (orientation: portrait)`,
    },
    {
      url: `/brand/startup/${height * scale}x${width * scale}.png`,
      media: `${media} and (orientation: landscape)`,
    },
  ];
});
