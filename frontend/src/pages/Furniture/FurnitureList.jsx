import { optimizeCloudinaryImage } from "../../utils/optimizeCloudinaryImage";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Search, ShoppingCart, X, Plus, Minus, MessageCircle, Sofa, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";
import { lookupPostalCode, reverseGeocodeLocation } from "../../utils/locationAddress";
import { requestLogin } from "../../utils/loginPrompt";
import "../../styles/furniture.css";

const WA_NUMBER = "919131181848";

const CATS = [
  { value: "all", label: "All" },
  { value: "bedroom", label: "Bedroom" },
  { value: "study", label: "Study" },
  { value: "kitchen", label: "Kitchen" },
  { value: "cooling-heating", label: "Cooling & Heating" },
  { value: "laundry-water", label: "Laundry & Water" },
  { value: "essentials", label: "Essentials" },
];

const AREAS = [
  "Vijay Nagar", "Bhawarkua", "Palasia", "Rajwada", "Sudama Nagar", "Geeta Bhawan",
  "Scheme 78", "Scheme 54", "Annapurna", "Khandwa Road", "Saket Nagar", "Other",
];

const fmt = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const hasRent = (i) => Array.isArray(i.rentPlans) && i.rentPlans.length > 0;
const hasBuy = (i) => Number(i.buyPrice) > 0;
const defaultPlan = (i) => i.rentPlans.find((p) => p.months === 6) || i.rentPlans[0];
const effMode = (i, mode) =>
  mode === "rent" ? (hasRent(i) ? "rent" : "buy") : hasBuy(i) ? "buy" : "rent";
const buyPriceFor = (i, cond) =>
  cond === "used" && Number(i.secondHandPrice) > 0 ? i.secondHandPrice : i.buyPrice;
const variantText = (l) =>
  l.mode === "rent" ? `Rent, ${l.months} months` : `Buy, ${l.cond === "used" ? "Second-hand" : "New"}`;

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

function Thumb({ src }) {
  return src ? <img src={optimizeCloudinaryImage(src, 640)} alt="" loading="lazy" /> : <Sofa size={26} />;
}

function FurnitureList() {
  const user = readUser();
  const loggedIn = Boolean(user && localStorage.getItem("token"));

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("rent");
  const [cat, setCat] = useState("all");
  const [donatedOnly, setDonatedOnly] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [d, setD] = useState({ mode: "rent", months: 6, cond: "new", qty: 1 });
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [addr, setAddr] = useState({ house: "", building: "", area: "", landmark: "", city: "Indore", state: "Madhya Pradesh", postalCode: "", date: "", phone: "" });
  const [loc, setLoc] = useState(null);
  const [locBusy, setLocBusy] = useState(false);
  const [postalLookupState, setPostalLookupState] = useState("");
  const [postalAreas, setPostalAreas] = useState([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    api
      .get("/furniture")
      .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Furniture fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!/^\d{6}$/.test(addr.postalCode)) return undefined;
    let active = true;
    const timeoutId = setTimeout(async () => {
      setPostalLookupState("loading");
      try {
        const postalAddress = await lookupPostalCode(addr.postalCode);
        if (!active) return;
        setPostalAreas(postalAddress.areas);
        setAddr((current) => ({
          ...current,
          area: postalAddress.areas[0] || current.area,
          city: postalAddress.city || current.city,
          state: postalAddress.state || current.state,
        }));
        setPostalLookupState("success");
      } catch (error) {
        if (!active) return;
        setPostalAreas([]);
        setPostalLookupState(error.message === "PIN code not found." ? "not-found" : "error");
      }
    }, 400);
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [addr.postalCode]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter(
      (i) => (cat === "all" || i.category === cat) && (!s || i.name.toLowerCase().includes(s))
        && (!donatedOnly || i.isDonated)
    );
  }, [items, cat, q, donatedOnly]);

  const openItem = (item) => {
    setSel(item);
    setD({
      mode: effMode(item, mode),
      months: hasRent(item) ? defaultPlan(item).months : 0,
      cond: "new",
      qty: 1,
    });
  };

  const detailUnit = () => {
    if (!sel) return 0;
    if (d.mode === "rent") {
      const p = sel.rentPlans.find((x) => x.months === d.months) || defaultPlan(sel);
      return p.monthlyRent;
    }
    return buyPriceFor(sel, d.cond);
  };

  const addToCart = () => {
    if (!sel || !sel.isAvailable) return;
    const rent = d.mode === "rent";
    const unit = detailUnit();
    const variant = rent ? d.months : d.cond;
    const key = `${sel._id}|${d.mode}|${variant}`;
    setCart((prev) => {
      const ex = prev.find((l) => l.key === key);
      if (ex) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + d.qty } : l));
      return [
        ...prev,
        {
          key,
          itemId: sel._id,
          name: sel.name,
          image: sel.images && sel.images[0],
          mode: d.mode,
          months: d.months,
          cond: d.cond,
          unit,
          deposit: rent ? sel.deposit || 0 : 0,
          delivery: sel.deliveryFee || 0,
          qty: d.qty,
        },
      ];
    });
    toast.success("Added to cart");
    setSel(null);
  };

  const changeQty = (key, delta) =>
    setCart((prev) =>
      prev.map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l)).filter((l) => l.qty > 0)
    );

  const totals = useMemo(() => {
    let rentMonthly = 0, deposit = 0, buyTotal = 0, delivery = 0, count = 0;
    cart.forEach((l) => {
      count += l.qty;
      delivery += l.delivery * l.qty;
      if (l.mode === "rent") {
        rentMonthly += l.unit * l.qty;
        deposit += l.deposit * l.qty;
      } else {
        buyTotal += l.unit * l.qty;
      }
    });
    return { rentMonthly, deposit, buyTotal, delivery, count, initial: rentMonthly + deposit + buyTotal + delivery };
  }, [cart]);

  const fetchLocation = () => {
    if (!navigator.geolocation) return toast.error("Location is not supported on this device");
    setLocBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLoc({ lat: latitude, lng: longitude });
        try {
          const locationAddress = await reverseGeocodeLocation(latitude, longitude);
          setAddr((current) => ({
            ...current,
            house: locationAddress.houseNumber || current.house,
            area: locationAddress.area || current.area,
            landmark: locationAddress.nearby || current.landmark,
            city: locationAddress.city || current.city,
            state: locationAddress.state || current.state,
            postalCode: locationAddress.postalCode || current.postalCode,
          }));
          toast.success("Current location and address added.");
        } catch {
          toast.error("Location found, but address lookup failed. Enter the address manually.");
        } finally {
          setLocBusy(false);
        }
      },
      () => {
        setLocBusy(false);
        toast.error("Location permission denied. You can still type your address.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const buildMessage = (r) => {
    const a = r.address;
    const lines = r.items.map(
      (l, i) => `${i + 1}. ${l.qty}x ${l.name} (${variantText(l)}) - ${fmt(l.unit)}${l.mode === "rent" ? "/month" : ""}`
    );
    return [
      `Hi RoomSlider, new furniture request ${r.requestCode}`,
      "",
      ...lines,
      "",
      `Monthly rent: ${fmt(r.totals.rentMonthly)}`,
      `Security deposit (refundable): ${fmt(r.totals.deposit)}`,
      `Buy total: ${fmt(r.totals.buyTotal)}`,
      `Delivery: ${fmt(r.totals.delivery)}`,
      `Initial payment: ${fmt(r.totals.initial)}`,
      "",
      `Name: ${r.name}`,
      `Phone: ${r.phone}`,
      `Address: ${[a.house, a.building, a.area, a.landmark ? "Near " + a.landmark : "", a.city, a.state, a.postalCode].filter(Boolean).join(", ")}`,
      ...(r.mapsLink ? [`Location: ${r.mapsLink}`] : []),
      ...(r.deliveryDate ? [`Preferred delivery date: ${r.deliveryDate}`] : []),
    ].join("\n");
  };

  const sendRequest = async () => {
    if (!loggedIn) {
      requestLogin("Please login to send your request");
      return;
    }
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!addr.house.trim()) return toast.error("Enter your house / flat number");
    if (!addr.area || !addr.city || !addr.state) return toast.error("Complete your area, city, and state");
    if (!/^\d{6}$/.test(addr.postalCode)) return toast.error("Enter a valid 6-digit PIN code");
    if (!/^\d{6}$/.test(addr.postalCode)) return toast.error("Enter a valid 6-digit PIN code");
    const phone = String((user && user.phone) || addr.phone || "").replace(/\D/g, "").slice(-10);
    if (phone.length !== 10) return toast.error("Enter a valid 10 digit phone number");

    setSending(true);
    try {
      const res = await api.post("/furniture-requests", {
        items: cart.map((l) => ({ itemId: l.itemId, mode: l.mode, months: l.months, cond: l.cond, qty: l.qty })),
        address: {
          house: addr.house,
          building: addr.building,
          area: addr.area,
          landmark: addr.landmark,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
        },
        location: loc,
        deliveryDate: addr.date,
        phone,
      });
      const r = res.data;
      const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildMessage(r))}`;
      setDone({ code: r.requestCode, url });
      setCart([]);
      window.open(url, "_blank");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not send request");
    } finally {
      setSending(false);
    }
  };

  const renderCart = () => {
    if (done) {
      return (
        <div className="fu-cart">
          <h3>Request saved</h3>
          <p className="fu-muted">
            Your request ID is <b>{done.code}</b>. Send it on WhatsApp so we can confirm quickly.
          </p>
          <a className="fu-wa" href={done.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            <MessageCircle size={18} /> Open WhatsApp
          </a>
          <button type="button" className="fu-add" style={{ background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
            onClick={() => { setDone(null); setCartOpen(false); }}>
            Done
          </button>
        </div>
      );
    }

    return (
      <div className="fu-cart">
        <h3>Your Cart Summary</h3>
        {cart.length === 0 ? (
          <p className="fu-muted">Cart is empty. Add items to send a request.</p>
        ) : (
          <>
            {cart.map((l) => (
              <div className="fu-line" key={l.key}>
                <div className="fu-thumb"><Thumb src={l.image} /></div>
                <div className="fu-info">
                  <b>{l.name}</b>
                  <span>{variantText(l)} · {fmt(l.unit)}{l.mode === "rent" ? "/mo" : ""}</span>
                </div>
                <div className="fu-stepper">
                  <button type="button" onClick={() => changeQty(l.key, -1)}><Minus size={14} /></button>
                  <span>{l.qty}</span>
                  <button type="button" onClick={() => changeQty(l.key, 1)}><Plus size={14} /></button>
                </div>
              </div>
            ))}

            <h4>Delivery Details</h4>
            {!loggedIn ? (
              <>
                <p className="fu-muted">Please login to send your request. Your name and phone will be filled automatically.</p>
                <button type="button" className="fu-add" style={{ marginTop: 0 }} onClick={() => requestLogin("Please login to send your request")}>
                  Login to continue
                </button>
              </>
            ) : (
              <>
                <p className="fu-user">
                  Ordering as <b>{user.name}</b>{user.phone ? <> · <b>{user.phone}</b></> : null}
                </p>
                {!user.phone && (
                  <input className="fu-input" placeholder="Phone number" inputMode="numeric" value={addr.phone}
                    onChange={(e) => setAddr({ ...addr, phone: e.target.value })} />
                )}
                <input className="fu-input" placeholder="House / flat number *" value={addr.house}
                  onChange={(e) => setAddr({ ...addr, house: e.target.value })} />
                <input className="fu-input" placeholder="Building / PG / hostel name" value={addr.building}
                  onChange={(e) => setAddr({ ...addr, building: e.target.value })} />
                <input className="fu-input" placeholder="Area / locality *" list="furniture-postal-areas" value={addr.area}
                  onChange={(e) => setAddr({ ...addr, area: e.target.value })} />
                <datalist id="furniture-postal-areas">
                  {[...new Set([...AREAS, ...postalAreas])].map((area) => <option key={area} value={area} />)}
                </datalist>
                <input className="fu-input" placeholder="Landmark (optional)" value={addr.landmark}
                  onChange={(e) => setAddr({ ...addr, landmark: e.target.value })} />
                <input className="fu-input" placeholder="City *" value={addr.city}
                  onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
                <input className="fu-input" placeholder="State *" value={addr.state}
                  onChange={(e) => setAddr({ ...addr, state: e.target.value })} />
                <input className="fu-input" placeholder="6-digit PIN code *" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={addr.postalCode}
                  onChange={(e) => setAddr({ ...addr, postalCode: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
                <span className="fu-muted" aria-live="polite">
                  {postalLookupState === "loading" && "Looking up area, city, and state..."}
                  {postalLookupState === "success" && "Area, city, and state filled from PIN code."}
                  {postalLookupState === "not-found" && "PIN code not found. Enter address details manually."}
                  {postalLookupState === "error" && "Could not look up PIN code. Enter address details manually."}
                </span>
                <button type="button" className={`fu-loc ${loc ? "on" : ""}`} onClick={fetchLocation} disabled={locBusy}>
                  <MapPin size={16} />
                  {locBusy ? "Getting location..." : loc ? "Location added (tap to update)" : "Use my current location"}
                </button>
                <input className="fu-input" type="date" value={addr.date}
                  onChange={(e) => setAddr({ ...addr, date: e.target.value })} />
              </>
            )}

            <h4>Order Total</h4>
            {totals.rentMonthly > 0 && <div className="fu-row"><span>Monthly rent</span><span>{fmt(totals.rentMonthly)}</span></div>}
            {totals.deposit > 0 && <div className="fu-row"><span>Deposit (refundable)</span><span>{fmt(totals.deposit)}</span></div>}
            {totals.buyTotal > 0 && <div className="fu-row"><span>Buy total</span><span>{fmt(totals.buyTotal)}</span></div>}
            {totals.delivery > 0 && <div className="fu-row"><span>Delivery</span><span>{fmt(totals.delivery)}</span></div>}
            <div className="fu-row total"><span>Initial payment</span><span>{fmt(totals.initial)}</span></div>

            {loggedIn && (
              <>
                <button type="button" className="fu-wa" onClick={sendRequest} disabled={sending}>
                  <MessageCircle size={18} /> {sending ? "Sending..." : "Request on WhatsApp"}
                </button>
                <p className="fu-muted" style={{ textAlign: "center", margin: "8px 0 0" }}>Confirm and start chat</p>
              </>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Furniture & Appliance Rental in Indore | RoomSlider</title>
        <meta name="description" content="Rent or buy bed, study table, fridge, cooler, AC and more for your room in Indore." />
      </Helmet>

      <section className="container fu-page">
        <div className="fu-head">
          <div>
            <h1>Furniture & Appliances</h1>
            <p className="fu-sub">Rent or buy. Delivered to your room in Indore.</p>
          </div>
          <button type="button" className="fu-cart-btn" onClick={() => setCartOpen(true)}>
            <ShoppingCart size={18} /> Cart
            {totals.count > 0 && <span className="fu-count">{totals.count}</span>}
          </button>
        </div>

        <div className="fu-toolbar">
          <div className="fu-search">
            <Search size={16} />
            <input placeholder="Search bed, cooler, fridge..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="fu-toggle">
            <button type="button" className={mode === "rent" ? "on" : ""} onClick={() => setMode("rent")}>Rent</button>
            <button type="button" className={mode === "buy" ? "on" : ""} onClick={() => setMode("buy")}>Buy</button>
          </div>
          <div className="fu-chips">
            {CATS.map((c) => (
              <button type="button" key={c.value} className={`fu-chip ${cat === c.value ? "on" : ""}`} onClick={() => setCat(c.value)}>
                {c.label}
              </button>
            ))}
            <button type="button" className={`fu-chip ${donatedOnly ? "on" : ""}`} onClick={() => setDonatedOnly((value) => !value)}>Donated</button>
          </div>
        </div>

        <div className="fu-layout">
          <div>
            {loading ? (
              <div className="skeleton-grid">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonRoomCard key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <h3>No items found</h3>
            ) : (
              <div className="fu-grid">
                {filtered.map((item) => {
                  const m = effMode(item, mode);
                  const out = !item.isAvailable;
                  const price = m === "rent" ? fmt(defaultPlan(item).monthlyRent) : fmt(item.buyPrice);
                  const alt =
                    m === "rent"
                      ? hasBuy(item) ? `Buy ${fmt(item.buyPrice)}` : "Rent only"
                      : hasRent(item) ? `Rent ${fmt(defaultPlan(item).monthlyRent)}/month` : "Buy only";
                  return (
                    <div key={item._id} className={`fu-card ${out ? "out" : ""}`} onClick={() => openItem(item)}>
                      <div className="fu-img"><Thumb src={item.images && item.images[0]} /></div>
                      {out ? <span className="fu-tag out">Out of stock</span> : item.isDonated ? <span className="fu-tag">Donated - low rent</span> : item.badge ? <span className="fu-tag">{item.badge}</span> : null}
                      <div className="fu-body">
                        <div className="fu-name">{item.name}</div>
                        <div className="fu-price">{price} {m === "rent" && <small>/ month</small>}</div>
                        <div className="fu-alt">{alt}</div>
                        <button type="button" className="fu-req" disabled={out}
                          onClick={(e) => { e.stopPropagation(); openItem(item); }}>
                          {out ? "Out of stock" : "Request"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <aside className="fu-aside">{renderCart()}</aside>
        </div>
      </section>

      {totals.count > 0 && (
        <button type="button" className="fu-floatbar" onClick={() => setCartOpen(true)}>
          <span>View cart ({totals.count})</span>
          <span>{fmt(totals.initial)}</span>
        </button>
      )}

      {sel && (
        <div className="fu-overlay" onClick={() => setSel(null)}>
          <div className="fu-sheet" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="fu-close" onClick={() => setSel(null)}><X size={16} /></button>
            <div className="fu-dimg"><Thumb src={sel.images && sel.images[0]} /></div>
            <div>
              <h2 className="fu-dtitle">{sel.name}</h2>
              <p className="fu-muted">{sel.description}</p>

              {hasRent(sel) && hasBuy(sel) && (
                <div className="fu-toggle" style={{ marginTop: 10 }}>
                  <button type="button" className={d.mode === "rent" ? "on" : ""} onClick={() => setD({ ...d, mode: "rent" })}>Rent</button>
                  <button type="button" className={d.mode === "buy" ? "on" : ""} onClick={() => setD({ ...d, mode: "buy" })}>Buy</button>
                </div>
              )}

              {d.mode === "rent" ? (
                <>
                  <div className="fu-label">Tenure</div>
                  <div className="fu-opts">
                    {sel.rentPlans.map((p) => (
                      <button type="button" key={p.months} className={`fu-opt ${d.months === p.months ? "on" : ""}`}
                        onClick={() => setD({ ...d, months: p.months })}>
                        {p.months} Months
                      </button>
                    ))}
                  </div>
                  <div className="fu-row"><span>Monthly rent</span><span>{fmt(detailUnit())}</span></div>
                  <div className="fu-row"><span>Security deposit (refundable)</span><span>{fmt(sel.deposit)}</span></div>
                  <div className="fu-row"><span>Delivery fee</span><span>{fmt(sel.deliveryFee)}</span></div>
                </>
              ) : (
                <>
                  {Number(sel.secondHandPrice) > 0 && (
                    <>
                      <div className="fu-label">Condition</div>
                      <div className="fu-opts">
                        <button type="button" className={`fu-opt ${d.cond === "new" ? "on" : ""}`} onClick={() => setD({ ...d, cond: "new" })}>New</button>
                        <button type="button" className={`fu-opt ${d.cond === "used" ? "on" : ""}`} onClick={() => setD({ ...d, cond: "used" })}>Second-hand</button>
                      </div>
                    </>
                  )}
                  <div className="fu-row"><span>Price</span><span>{fmt(detailUnit())}</span></div>
                  {sel.deliveryFee > 0 && <div className="fu-row"><span>Delivery fee</span><span>{fmt(sel.deliveryFee)}</span></div>}
                </>
              )}

              <div className="fu-label">Quantity</div>
              <div className="fu-stepper">
                <button type="button" onClick={() => setD({ ...d, qty: Math.max(1, d.qty - 1) })}><Minus size={14} /></button>
                <span>{d.qty}</span>
                <button type="button" onClick={() => setD({ ...d, qty: d.qty + 1 })}><Plus size={14} /></button>
              </div>

              <button type="button" className="fu-add" disabled={!sel.isAvailable} onClick={addToCart}>
                {sel.isAvailable ? "Add to cart" : "Out of stock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fu-overlay fu-cart-overlay" onClick={() => setCartOpen(false)}>
          <div className="fu-sheet" style={{ display: "block" }} onClick={(e) => e.stopPropagation()}>
            <button type="button" className="fu-close" onClick={() => setCartOpen(false)}><X size={16} /></button>
            {renderCart()}
          </div>
        </div>
      )}
    </>
  );
}

export default FurnitureList;
