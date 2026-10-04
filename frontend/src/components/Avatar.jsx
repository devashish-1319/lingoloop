import { useState } from "react";

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

// Profile picture with an initials placeholder underneath: while the image loads, or if it is missing
// or fails (e.g. a dead third-party avatar URL), the initials stay visible instead of a blank circle.
// Drop it inside a sized container (e.g. daisyUI `.avatar > div`); it fills the container.
const Avatar = ({ src, name, alt = "", className = "" }) => {
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = src && failedSrc !== src;

  return (
    <span
      className="relative flex items-center justify-center w-full h-full bg-primary text-primary-content font-semibold select-none overflow-hidden rounded-full"
      role={alt && !showImage ? "img" : undefined}
      aria-label={alt && !showImage ? alt : undefined}
    >
      <span aria-hidden="true">{initialsOf(name)}</span>
      {showImage && (
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover ${className}`}
          onError={() => setFailedSrc(src)}
        />
      )}
    </span>
  );
};

export default Avatar;
