import { useEffect, useState } from "react";
import { getSignedPhotoUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | undefined | null;
};

/**
 * <img> que resolve uma signed URL para fotos do bucket privado `anamnese-fotos`.
 * Aceita tanto paths quanto URLs públicas legadas.
 */
export function SignedImg({ src, className, alt, ...rest }: Props) {
  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!src) {
      setResolved(null);
      return;
    }
    getSignedPhotoUrl(src).then((url) => {
      if (active) setResolved(url);
    });
    return () => {
      active = false;
    };
  }, [src]);

  if (!resolved) {
    return (
      <div
        className={cn("bg-muted/40 animate-pulse", className)}
        aria-label={alt || "Carregando imagem"}
      />
    );
  }

  return <img src={resolved} alt={alt} className={className} {...rest} />;
}
