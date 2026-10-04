import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  MapPin,
  Phone,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import SkeletonDetailCard from "../../components/ui/SkeletonDetailCard";
import { useAuth } from "../../context/AuthContext";
import { reverseGeocodeLocation } from "../../utils/locationAddress";
import "../../styles/mess.css";

const formatPrice = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

function MessDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [mess, setMess] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [thaliCount, setThaliCount] = useState(1);
  const [addOnQuantities, setAddOnQuantities] = useState({});
  const [ordering, setOrdering] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState({
    recipientName: user?.name || "",
    phone: user?.phone || "",
    address: [user?.preferredArea, user?.city].filter(Boolean).join(", "),
    latitude: null,
    longitude: null,
  });
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setLoading(true);
        setMess(null);
      }
    });
    Promise.allSettled([
      api.get(`/mess/public/${id}`),
      api.get(`/mess/public/${id}/reviews`),
      user ? api.get("/users/me") : Promise.resolve(null),
    ])
      .then(([messResult, reviewResult, profileResult]) => {
        if (!active) return;
        if (messResult.status === "rejected") throw messResult.reason;
        setMess(messResult.value.data);
        setReviews(reviewResult.status === "fulfilled" ? reviewResult.value.data?.reviews || [] : []);
        if (reviewResult.status === "rejected") {
          console.error("MESS REVIEWS LOAD ERROR:", reviewResult.reason);
        }
        const profile = profileResult?.status === "fulfilled" ? profileResult.value?.data?.user : null;
        setDeliveryAddress((current) => ({
          ...current,
          recipientName: profile?.name || user?.name || current.recipientName,
          phone: profile?.phone || user?.phone || current.phone,
          address: [
            profile?.address,
            profile?.area || profile?.preferredArea || user?.preferredArea,
            profile?.city || user?.city,
          ].filter(Boolean).join(", ") || current.address,
        }));
        setAddOnQuantities({});
      })
      .catch((error) => {
        console.error("MESS DETAIL ERROR:", error);
        if (active) toast.error("Mess details could not be loaded");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id, user]);

  const availableAddOns = useMemo(
    () => (mess?.addOns || []).filter((item) => item.isAvailable !== false),
    [mess]
  );
  const selectedAddOns = useMemo(
    () => availableAddOns
      .map((item) => ({
        addOnId: item._id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(addOnQuantities[item._id] || 0),
      }))
      .filter((item) => item.quantity > 0),
    [addOnQuantities, availableAddOns]
  );
  const addOnTotal = selectedAddOns.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Number(mess?.pricePerPerson || 0) * thaliCount + addOnTotal;
  const ratingAverage = Number(mess?.ratingAverage || 0);
  const ratingCount = Number(mess?.ratingCount || 0);

  const changeAddOnQuantity = (addOnId, delta) => {
    setAddOnQuantities((current) => {
      const nextQuantity = Math.max(0, Math.min(50, Number(current[addOnId] || 0) + delta));
      return { ...current, [addOnId]: nextQuantity };
    });
  };

  const useCurrentDeliveryLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not supported on this device.");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const location = await reverseGeocodeLocation(
            position.coords.latitude,
            position.coords.longitude
          );
          setDeliveryAddress((current) => ({
            ...current,
            address: location.formattedAddress || current.address,
            latitude: location.latitude,
            longitude: location.longitude,
          }));
          toast.success("Current delivery location added.");
        } catch (error) {
          toast.error(error.message || "Could not find the address for your location.");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationLoading(false);
        toast.error("Location access was unavailable. Enter the delivery address manually.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const handleOrder = async () => {
    if (!user) {
      toast.error("Please log in before placing an order.");
      return;
    }
    if (
      !deliveryAddress.recipientName.trim() ||
      !/^[6-9]\d{9}$/.test(deliveryAddress.phone.replace(/\D/g, "")) ||
      !deliveryAddress.address.trim()
    ) {
      toast.error("Enter a recipient name, valid phone number, and delivery address.");
      return;
    }
    try {
      setOrdering(true);
      const orderRes = await api.post("/payments/mess/create-order", {
        messId: mess._id,
        thaliCount,
        addOns: selectedAddOns.map(({ addOnId, quantity }) => ({ addOnId, quantity })),
        deliveryAddress: {
          ...deliveryAddress,
          phone: deliveryAddress.phone.replace(/\D/g, ""),
        },
      });

      const { orderId, amount, currency, key } = orderRes.data;
      const options = {
        key,
        amount,
        currency,
        order_id: orderId,
        name: "RoomSlider",
        description: `${mess.name} - ${thaliCount} ${mess.mealType === "tiffin" ? "Tiffin(s)" : "Thali(s)"}`,
        handler: async (response) => {
          try {
            await api.post("/payments/mess/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("Order placed successfully!");
          } catch (verifyError) {
            console.error("MESS PAYMENT VERIFY ERROR:", verifyError);
            toast.error("Payment could not be verified. Contact support.");
          }
        },
        theme: { color: "#16a34a" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("CREATE MESS ORDER ERROR:", error);
      toast.error(error.response?.data?.message || "Failed to start order");
    } finally {
      setOrdering(false);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    try {
      setReviewSaving(true);
      const response = await api.post(`/mess/${mess._id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviews((current) => [response.data.review, ...current]);
      setMess((current) => ({
        ...current,
        ratingAverage: response.data.ratingAverage,
        ratingCount: response.data.ratingCount,
      }));
      setReviewComment("");
      toast.success("Thanks for sharing your review!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not submit your review");
    } finally {
      setReviewSaving(false);
    }
  };

  if (loading) {
    return <div className="container mess-detail-loading"><SkeletonDetailCard /></div>;
  }

  if (!mess) {
    return (
      <main className="container mess-detail-page">
        <Link className="mess-back-link" to="/mess"><ArrowLeft size={17} /> All mess services</Link>
        <div className="mess-empty-state"><h2>Mess not found</h2></div>
      </main>
    );
  }

  if (mess.slug && id !== mess.slug) {
    return <Navigate to={`/mess/${mess.slug}`} replace />;
  }

  const menuItems = mess.todayMenu?.items || [];
  const menuGroups = menuItems.reduce((groups, item) => {
    const category = item.category || "Other";
    groups[category] ||= [];
    groups[category].push(item);
    return groups;
  }, {});
  const listedCalories = menuItems.reduce(
    (total, item) => total + (Number(item.calories) || 0),
    0
  );
  const calorieItemsCount = menuItems.filter((item) => Number(item.calories) > 0).length;
  const isTiffin = mess.mealType === "tiffin";

  return (
    <>
      <Helmet>
        <title>{mess.name} | Mess in Indore | RoomSlider</title>
        <meta
          name="description"
          content={`See today's menu, available sides, and thali price at ${mess.name} in Indore.`}
        />
      </Helmet>

      <main className="container mess-detail-page">
        <Link className="mess-back-link" to="/mess"><ArrowLeft size={17} /> All mess services</Link>

        <header className="mess-detail-heading">
          <div>
            <h1>{mess.name}</h1>
            <p><MapPin size={16} />{mess.address}</p>
          </div>
          <div className="mess-detail-rating">
            <Star size={16} fill="currentColor" />
            <strong>{ratingCount ? ratingAverage.toFixed(1) : "New"}</strong>
            {ratingCount > 0 && <span>{ratingCount} {ratingCount === 1 ? "review" : "reviews"}</span>}
          </div>
        </header>

        <div className={`mess-photo-gallery ${mess.images?.length ? "" : "is-empty"} ${mess.images?.length === 1 ? "is-single" : ""}`}>
          {mess.images?.length ? mess.images.slice(0, 5).map((image, index) => (
            <img key={`${image}-${index}`} src={optimizeCloudinaryImage(image, 640)} alt={`${mess.name} meal ${index + 1}`} loading="lazy" />
          )) : (
            <div><UtensilsCrossed size={42} /><span>Photos coming soon</span></div>
          )}
        </div>

        <div className="mess-detail-layout">
          <div className="mess-detail-main">
            <section className="mess-detail-section">
              <div className="mess-detail-section-heading">
                <div>
                  <p>Prepared fresh</p>
                  <h2>{isTiffin ? "Today’s tiffin box" : "Today’s thali"}</h2>
                </div>
                {mess.todayMenu?.date && <time>{mess.todayMenu.date}</time>}
              </div>
              {menuItems.length ? (
                <>
                  <div className={`mess-meal-graphic ${isTiffin ? "mess-tiffin-graphic" : "mess-thali-graphic"}`}>
                    <div className="mess-meal-graphic-top">
                      <span className="mess-meal-graphic-icon"><UtensilsCrossed size={17} /></span>
                      <div>
                        <strong>{isTiffin ? "Tiffin menu" : "Thali menu"}</strong>
                        <span>{Object.keys(menuGroups).length} food sections</span>
                      </div>
                      {calorieItemsCount > 0 && (
                        <span className="mess-calorie-total">{listedCalories} kcal listed</span>
                      )}
                    </div>
                    <div className="mess-menu-sections">
                      {Object.entries(menuGroups).map(([category, items], index) => (
                        <section className="mess-menu-category" key={category}>
                          <h3><span>{index + 1}</span>{category}</h3>
                          <ul>
                            {items.map((item, itemIndex) => (
                              <li key={`${item.name}-${itemIndex}`}>
                                <span><Check size={14} />{item.name}</span>
                                {Number(item.calories) > 0 && <small>{Number(item.calories)} kcal</small>}
                              </li>
                            ))}
                          </ul>
                        </section>
                      ))}
                    </div>
                  </div>
                  <p className="mess-calorie-note">
                    {calorieItemsCount
                      ? "Calories are listed per menu item and may vary by serving."
                      : "Calories have not been provided for today’s menu."}
                  </p>
                </>
              ) : (
                <p className="mess-muted-copy">Today’s menu hasn’t been updated yet.</p>
              )}
            </section>

            <section className="mess-detail-section">
              <div className="mess-detail-section-heading">
                <div>
                  <p>Make it your own</p>
                  <h2>Extras &amp; sides</h2>
                </div>
              </div>
              {availableAddOns.length ? (
                <div className="mess-addon-list">
                  {availableAddOns.map((item) => {
                    const quantity = Number(addOnQuantities[item._id] || 0);
                    return (
                      <div className="mess-addon-item" key={item._id}>
                        <div className="mess-addon-item-icon"><UtensilsCrossed size={17} /></div>
                        <div className="mess-addon-item-info">
                          <strong>{item.name}</strong>
                          <span>{formatPrice(item.price)} each</span>
                        </div>
                        {quantity ? (
                          <div className="mess-addon-quantity">
                            <button type="button" onClick={() => changeAddOnQuantity(item._id, -1)} aria-label={`Remove one ${item.name}`}><ChevronDown size={17} /></button>
                            <span>{quantity}</span>
                            <button type="button" onClick={() => changeAddOnQuantity(item._id, 1)} aria-label={`Add one ${item.name}`}><ChevronUp size={17} /></button>
                          </div>
                        ) : (
                          <button type="button" className="mess-addon-add-button" onClick={() => changeAddOnQuantity(item._id, 1)}>Add</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mess-muted-copy">No extra sides are listed right now.</p>
              )}
            </section>

            <section className="mess-detail-section mess-reviews-section">
              <div className="mess-detail-section-heading">
                <div>
                  <p>From customers</p>
                  <h2>Reviews {ratingCount > 0 && <span>· {ratingAverage.toFixed(1)} ({ratingCount})</span>}</h2>
                </div>
              </div>

              {user && (
                <form className="mess-review-form" onSubmit={handleReviewSubmit}>
                  <label htmlFor="mess-review-comment">Share your experience after a paid order</label>
                  <div className="mess-review-form-controls">
                    <select value={reviewRating} onChange={(event) => setReviewRating(Number(event.target.value))} aria-label="Your rating">
                      {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} star{value > 1 ? "s" : ""}</option>)}
                    </select>
                    <input
                      id="mess-review-comment"
                      maxLength={500}
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      placeholder="What did you think of the food?"
                    />
                    <button type="submit" disabled={reviewSaving}>{reviewSaving ? "Sending..." : "Review"}</button>
                  </div>
                </form>
              )}

              {reviews.length ? (
                <div className="mess-reviews-list">
                  {reviews.map((review) => (
                    <article className="mess-review-card" key={review._id}>
                      <div className="mess-review-author">
                        <strong>{review.user?.name || "Customer"}</strong>
                        <span><Star size={13} fill="currentColor" /> {review.rating}</span>
                      </div>
                      {review.comment && <p>{review.comment}</p>}
                      <time>{new Date(review.createdAt).toLocaleDateString()}</time>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mess-muted-copy">No reviews yet. Be the first to share your experience after ordering.</p>
              )}
            </section>
          </div>

          <aside className="mess-order-card">
            <div className="mess-order-price">
              <strong>{formatPrice(mess.pricePerPerson)}</strong>
              <span>per {isTiffin ? "tiffin" : "thali"}</span>
            </div>
            <section className="mess-delivery-form">
              <h2>Delivery details</h2>
              <label>
                Recipient name
                <input
                  value={deliveryAddress.recipientName}
                  maxLength={100}
                  onChange={(event) => setDeliveryAddress((current) => ({ ...current, recipientName: event.target.value }))}
                  placeholder="Name for delivery"
                />
              </label>
              <label>
                Phone number
                <input
                  type="tel"
                  inputMode="numeric"
                  value={deliveryAddress.phone}
                  maxLength={10}
                  onChange={(event) => setDeliveryAddress((current) => ({
                    ...current,
                    phone: event.target.value.replace(/\D/g, "").slice(0, 10),
                  }))}
                  placeholder="10-digit mobile number"
                />
              </label>
              <label>
                Full delivery address
                <textarea
                  value={deliveryAddress.address}
                  maxLength={500}
                  onChange={(event) => setDeliveryAddress((current) => ({
                    ...current,
                    address: event.target.value,
                    latitude: null,
                    longitude: null,
                  }))}
                  placeholder="House / flat, area, landmark, city"
                  rows={3}
                />
              </label>
              <button
                className="mess-use-location"
                type="button"
                onClick={useCurrentDeliveryLocation}
                disabled={locationLoading}
              >
                <MapPin size={15} />
                {locationLoading ? "Finding location..." : "Use current location"}
              </button>
              {deliveryAddress.latitude != null && deliveryAddress.longitude != null && (
                <p className="mess-map-pin-confirmation">
                  <Check size={14} /> Map pin saved for delivery
                </p>
              )}
            </section>
            <div className="mess-order-count">
              <span>Number of {isTiffin ? "tiffins" : "thalis"}</span>
              <div className="mess-stepper">
                <button type="button" onClick={() => setThaliCount((count) => Math.max(1, count - 1))} aria-label="Remove one thali">−</button>
                <span>{thaliCount}</span>
                <button type="button" onClick={() => setThaliCount((count) => Math.min(50, count + 1))} aria-label="Add one thali">+</button>
              </div>
            </div>
            {selectedAddOns.length > 0 && (
              <div className="mess-order-addons">
                {selectedAddOns.map((item) => (
                  <div key={item.addOnId}>
                    <span>{item.name} × {item.quantity}</span>
                    <strong>{formatPrice(item.price * item.quantity)}</strong>
                  </div>
                ))}
              </div>
            )}
            <div className="mess-order-total">
              <span>Total</span>
              <strong><IndianRupee size={17} />{total.toLocaleString("en-IN")}</strong>
            </div>
            {user ? (
              <button className="mess-order-button" type="button" onClick={handleOrder} disabled={ordering || locationLoading}>
                {ordering ? "Starting secure payment..." : `Pay ${formatPrice(total)}`}
              </button>
            ) : (
              <Link className="mess-order-button" to="/login">Log in to order</Link>
            )}
            <a className="mess-call-button" href={`tel:${mess.phone}`}><Phone size={16} /> Call mess</a>
            <p className="mess-payment-note">Your add-ons and total are confirmed before payment.</p>
          </aside>
        </div>
      </main>
    </>
  );
}

export default MessDetail;
