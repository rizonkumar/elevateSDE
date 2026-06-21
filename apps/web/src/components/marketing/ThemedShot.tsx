interface ThemedShotProps {
  name: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  position?: string;
}

export function ThemedShot({
  name,
  alt,
  width,
  height,
  className = '',
  position = 'object-top',
}: ThemedShotProps) {
  const shared = `block h-full w-full object-cover ${position} ${className}`;
  return (
    <>
      <img
        src={`/screenshots/${name}-light.png`}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={`${shared} dark:hidden`}
      />
      <img
        src={`/screenshots/${name}-dark.png`}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        className={`hidden dark:block ${shared}`}
      />
    </>
  );
}
