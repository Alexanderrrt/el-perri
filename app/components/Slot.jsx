import Image from "next/image";
import { IMAGES } from "../site.config";

export function Slot({ name, label, priority = false, sizes = "100vw" }) {
  const src = IMAGES[name];
  if (src) {
    return (
      <Image
        src={src}
        alt={label}
        fill
        sizes={sizes}
        priority={priority}
        className="slot-img"
        style={{ objectFit: "cover" }}
      />
    );
  }
  return (
    <div className="slot">
      <span>{label}</span>
    </div>
  );
}
