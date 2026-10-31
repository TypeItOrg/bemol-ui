export function toPlatformInternalPath(path: string): string {
  return path === "/" ? "/admin" : `/admin${path}`;
}

export function toPlatformPublicPath(path: string): string {
  const publicPath = path.replace(/^\/admin(?=\/|\?|#|$)/, "");

  return !publicPath || publicPath.startsWith("?") || publicPath.startsWith("#") ? `/${publicPath}` : publicPath;
}
