function PropertyDetailsSkeleton() {
  return (
    <main className="pd-root pd-skeleton" aria-label="Loading property details">
      <div className="pd-skeleton-title">
        <span />
        <span />
      </div>
      <div className="pd-skeleton-gallery"><span /></div>
      <div className="pd-skeleton-layout">
        <div className="pd-skeleton-copy">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="pd-skeleton-contact">
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </main>
  );
}

export default PropertyDetailsSkeleton;
