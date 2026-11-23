import { forwardRef, type ImgHTMLAttributes } from "react"

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | { src: string }; priority?: boolean; unoptimized?: boolean; fill?: boolean; quality?: number; loader?: unknown; placeholder?: string; blurDataURL?: string
}
/** The same image geometry and public asset paths, served from the APK rather
 * than Next's online image optimizer. Foreign images are not silently fetched. */
export default forwardRef<HTMLImageElement, ImageProps>(function NativeImage({ src, alt = "", priority, unoptimized, fill, quality, loader, placeholder, blurDataURL, style, ...props }, ref) {
  // Next-only optimizer options are deliberately consumed, never DOM attributes.
  void [unoptimized, quality, loader, placeholder, blurDataURL]
  const original = typeof src === "string" ? src : src.src
  const local = original.startsWith("/") ? "./public" + original : original
  // eslint-disable-next-line @next/next/no-img-element -- packaged files use no online image optimizer
  return <img {...props} alt={alt} ref={ref} src={local} loading={priority ? "eager" : props.loading} style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style} />
})

