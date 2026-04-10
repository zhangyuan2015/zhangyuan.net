"use client";

import { useMemo, useState } from "react";

type PhotoItem = {
  id: number;
  url: string;
  thumbUrl: string | null;
  previewUrl: string | null;
  description: string | null;
  albumTitle: string;
};

type GalleryGridProps = {
  photos: PhotoItem[];
};

function withQiniuParams(url: string, params: string) {
  return `${url}${url.includes("?") ? "&" : "?"}${params}`;
}

export function GalleryGrid({ photos }: GalleryGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragAnchor, setDragAnchor] = useState<{ x: number; y: number } | null>(null);
  const [showPrevControl, setShowPrevControl] = useState(false);
  const [showNextControl, setShowNextControl] = useState(false);

  const enhanced = useMemo(
    () =>
      photos.map((item) => ({
        ...item,
        thumbUrl:
          item.thumbUrl ||
          withQiniuParams(item.url, "imageView2/2/w/560/h/560/interlace/1/q/75"),
        previewUrl:
          item.previewUrl ||
          withQiniuParams(item.url, "imageView2/2/w/1800/interlace/1/q/90"),
      })),
    [photos],
  );

  const active = activeIndex === null ? null : enhanced[activeIndex];

  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setDragAnchor(null);
  };

  const goPrev = () => {
    if (activeIndex === null) return;
    setImageLoading(true);
    resetView();
    setActiveIndex((activeIndex - 1 + enhanced.length) % enhanced.length);
  };
  const goNext = () => {
    if (activeIndex === null) return;
    setImageLoading(true);
    resetView();
    setActiveIndex((activeIndex + 1) % enhanced.length);
  };

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {enhanced.map((item, index) => (
          <li key={item.id} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
            <button
              type="button"
              className="block w-full"
              onClick={() => {
                setImageLoading(true);
                resetView();
                setActiveIndex(index);
              }}
              title={item.description || item.albumTitle}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.thumbUrl} alt={item.description || item.albumTitle} className="aspect-square w-full object-cover transition hover:scale-[1.02]" loading="lazy" />
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <div className="fixed inset-0 z-[70] bg-black p-4">
          <div className="mx-auto flex h-full max-w-6xl flex-col">
            <div className="relative z-20 mb-3 flex items-center justify-between text-sm text-slate-300">
              <p>{active.albumTitle}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setZoom((z) => {
                      const next = Math.max(1, +(z - 0.2).toFixed(2));
                      if (next === 1) {
                        setOffset({ x: 0, y: 0 });
                        setIsDragging(false);
                        setDragAnchor(null);
                      }
                      return next;
                    })
                  }
                  className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
                >
                  缩小
                </button>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(4, +(z + 0.2).toFixed(2)))}
                  className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
                >
                  放大
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => r - 90)}
                  className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
                >
                  左转
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => r + 90)}
                  className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
                >
                  右转
                </button>
                <button
                  type="button"
                  onClick={resetView}
                  className="rounded border border-slate-600 px-2 py-1 hover:bg-slate-800"
                >
                  重置
                </button>
                <button type="button" onClick={() => setActiveIndex(null)} className="rounded border border-slate-600 px-3 py-1 hover:bg-slate-800">
                  关闭
                </button>
              </div>
            </div>
            <div
              className="relative flex flex-1 items-center justify-center overflow-hidden"
              onMouseMove={(e) => {
                if (isDragging && dragAnchor) {
                  setOffset({
                    x: e.clientX - dragAnchor.x,
                    y: e.clientY - dragAnchor.y,
                  });
                  setShowPrevControl(false);
                  setShowNextControl(false);
                  return;
                }
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                setShowPrevControl(ratio < 0.2);
                setShowNextControl(ratio > 0.8);
              }}
              onMouseLeave={() => {
                setShowPrevControl(false);
                setShowNextControl(false);
                setIsDragging(false);
                setDragAnchor(null);
              }}
              onMouseUp={() => {
                setIsDragging(false);
                setDragAnchor(null);
              }}
            >
              {showPrevControl ? (
                <button type="button" onClick={goPrev} className="absolute left-2 z-20 rounded-full bg-slate-900/80 px-3 py-2 text-white">
                  上一张
                </button>
              ) : null}
              {imageLoading ? (
                <div className="absolute z-10 flex items-center gap-2 rounded-full bg-slate-900/80 px-4 py-2 text-sm text-slate-200">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-400 border-t-white" />
                  加载中...
                </div>
              ) : null}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.previewUrl}
                alt={active.description || active.albumTitle}
                className={`max-h-[78vh] max-w-full rounded object-contain transition-opacity ${imageLoading ? "opacity-40" : "opacity-100"} ${zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"}`}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
                onMouseDown={(e) => {
                  if (zoom <= 1) return;
                  e.preventDefault();
                  setIsDragging(true);
                  setDragAnchor({
                    x: e.clientX - offset.x,
                    y: e.clientY - offset.y,
                  });
                }}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
              {showNextControl ? (
                <button type="button" onClick={goNext} className="absolute right-2 z-20 rounded-full bg-slate-900/80 px-3 py-2 text-white">
                  下一张
                </button>
              ) : null}
            </div>
            <p className="mt-3 text-center text-sm text-slate-300">{active.description || "无描述"}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
