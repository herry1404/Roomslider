import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Grid2X2, Heart, Share2, X } from "lucide-react";

function Photo({ src, alt, className = "", loading = "lazy" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <div className={`pd-photo-fallback ${className}`} aria-label="Photo unavailable" role="img" />;
  }

  return (
    <img
      className={className}
      src={optimizeCloudinaryImage(src, 1600)}
      alt={alt}
      width="1600"
      height="1200"
      draggable={false}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
}

function PhotoGallery({
  images = [],
  title,
  wishlisted,
  onBack,
  onSave,
  onShare,
  showSave = true,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);
  const carouselRef = useRef(null);
  const touchStartX = useRef(null);
  const galleryImages = images.filter(Boolean);
  const galleryCount = Math.min(galleryImages.length, 5);

  useEffect(() => {
    if (!viewerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setViewerOpen(false);
      if (event.key === "ArrowLeft" && galleryImages.length > 1) {
        setActiveIndex((index) => (index === 0 ? galleryImages.length - 1 : index - 1));
      }
      if (event.key === "ArrowRight" && galleryImages.length > 1) {
        setActiveIndex((index) => (index + 1) % galleryImages.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [galleryImages.length, viewerOpen]);

  const openViewer = (index) => {
    setActiveIndex(index);
    setViewerOpen(true);
  };

  const goTo = (index) => {
    if (!galleryImages.length) return;
    setActiveIndex((index + galleryImages.length) % galleryImages.length);
  };

  const handleCarouselScroll = () => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const slideWidth = carousel.clientWidth;
    if (slideWidth) setActiveIndex(Math.round(carousel.scrollLeft / slideWidth));
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return;
    const difference = touchStartX.current - event.changedTouches[0].clientX;
    if (difference > 50) goTo(activeIndex + 1);
    if (difference < -50) goTo(activeIndex - 1);
    touchStartX.current = null;
  };

  return (
    <>
      <section
        className={`pd-gallery pd-gallery--${galleryCount || 1}${galleryImages.length ? "" : " pd-gallery--empty"}`}
        aria-label="Property photos"
      >
        <div
          className="pd-gallery-track"
          ref={carouselRef}
          onScroll={handleCarouselScroll}
        >
          {galleryImages.length ? galleryImages.map((image, index) => (
            <button
              type="button"
              className={`pd-gallery-photo pd-gallery-photo--${index + 1}`}
              key={`${image}-${index}`}
              onClick={() => openViewer(index)}
              aria-label={`Open photo ${index + 1} of ${galleryImages.length}`}
            >
              <Photo
                src={image}
                alt={`${title} photo ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
              />
            </button>
          )) : (
            <div className="pd-gallery-empty">
              <div className="pd-photo-fallback" role="img" aria-label="No photos available" />
            </div>
          )}
        </div>

        {galleryImages.length > 0 && (
          <>
            <div className="pd-gallery-mobile-count" aria-live="polite">
              {activeIndex + 1} / {galleryImages.length}
            </div>
            <div className="pd-gallery-mobile-controls">
              <button type="button" onClick={onBack} aria-label="Go back">
                <ArrowLeft size={19} />
              </button>
              <div>
                {onShare && (
                  <button type="button" onClick={onShare} aria-label="Share this listing">
                    <Share2 size={18} />
                  </button>
                )}
                {showSave && onSave && (
                  <button type="button" onClick={onSave} aria-label={wishlisted ? "Remove from saved listings" : "Save listing"}>
                    <Heart size={18} fill={wishlisted ? "currentColor" : "none"} />
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              className="pd-show-photos"
              onClick={() => openViewer(activeIndex)}
            >
              <Grid2X2 size={16} /> Show all photos
            </button>
          </>
        )}
      </section>

      {viewerOpen && createPortal(
        <div
          className="pd-viewer"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photos`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewerOpen(false);
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            className="pd-viewer-close"
            onClick={() => setViewerOpen(false)}
            aria-label="Close photo viewer"
          >
            <X size={22} />
          </button>
          <span className="pd-viewer-count">{activeIndex + 1} / {galleryImages.length}</span>
          <Photo
            src={galleryImages[activeIndex]}
            alt={`${title} photo ${activeIndex + 1}`}
            className="pd-viewer-image"
            loading="eager"
          />
          {galleryImages.length > 1 && (
            <>
              <button type="button" className="pd-viewer-arrow pd-viewer-arrow--prev" onClick={() => goTo(activeIndex - 1)} aria-label="Previous photo">
                <ChevronLeft size={26} />
              </button>
              <button type="button" className="pd-viewer-arrow pd-viewer-arrow--next" onClick={() => goTo(activeIndex + 1)} aria-label="Next photo">
                <ChevronRight size={26} />
              </button>
              <div className="pd-viewer-dots" aria-label="Choose a photo">
                {galleryImages.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    onClick={() => goTo(index)}
                    aria-label={`Show photo ${index + 1}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

export default PhotoGallery;
