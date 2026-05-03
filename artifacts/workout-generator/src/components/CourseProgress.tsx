import { useRef, useState } from "react";
import { isNative } from "@/lib/native";

interface Photos {
  before: string | null;
  after: string | null;
}

function loadPhotos(courseId: string): Photos {
  try {
    const s = window.localStorage.getItem(`wg_photos_v1_${courseId}`);
    return s ? (JSON.parse(s) as Photos) : { before: null, after: null };
  } catch {
    return { before: null, after: null };
  }
}

function savePhotos(courseId: string, photos: Photos): void {
  try {
    window.localStorage.setItem(`wg_photos_v1_${courseId}`, JSON.stringify(photos));
  } catch {}
}

async function pickPhoto(): Promise<string | null> {
  if (isNative()) {
    try {
      const { Camera, CameraSource, CameraResultType } = await import("@capacitor/camera");
      const photo = await Camera.getPhoto({
        source: CameraSource.Prompt,
        resultType: CameraResultType.Base64,
        quality: 70,
        width: 800,
      });
      return photo.base64String ? `data:image/jpeg;base64,${photo.base64String}` : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function CourseProgress({ courseId }: { courseId: string }) {
  const [photos, setPhotos] = useState<Photos>(() => loadPhotos(courseId));
  const [expanded, setExpanded] = useState(false);
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const update = (key: "before" | "after", val: string | null) => {
    const next = { ...photos, [key]: val };
    setPhotos(next);
    savePhotos(courseId, next);
  };

  const handleNativePhoto = async (key: "before" | "after") => {
    const data = await pickPhoto();
    if (data) update(key, data);
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: "before" | "after",
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") update(key, result);
    };
    reader.readAsDataURL(file);
  };

  const addPhoto = (key: "before" | "after") => {
    if (isNative()) {
      void handleNativePhoto(key);
    } else {
      if (key === "before") beforeInputRef.current?.click();
      else afterInputRef.current?.click();
    }
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/40 transition"
      >
        <span>Фото «До и После»</span>
        <span className="text-muted-foreground text-sm">{expanded ? "▾" : "▸"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t bg-background/50 pt-3">
          <p className="text-xs text-muted-foreground">
            Добавьте фото в начале и конце курса, чтобы увидеть прогресс.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {(["before", "after"] as const).map((key) => {
              const label = key === "before" ? "ДО" : "ПОСЛЕ";
              const src = photos[key];
              return (
                <div key={key} className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground text-center">
                    {label}
                  </p>
                  {src ? (
                    <div className="relative group">
                      <img
                        src={src}
                        alt={label}
                        className="w-full aspect-square object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => update(key, null)}
                        className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        aria-label="Удалить фото"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addPhoto(key)}
                      className="w-full aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition"
                    >
                      <span className="text-2xl">+</span>
                      <span className="text-xs">Добавить фото</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <input
            ref={beforeInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e, "before")}
          />
          <input
            ref={afterInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e, "after")}
          />
        </div>
      )}
    </div>
  );
}
