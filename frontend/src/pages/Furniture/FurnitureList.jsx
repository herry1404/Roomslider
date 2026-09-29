import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Search, ShoppingCart, X, Plus, Minus, MessageCircle, Sofa } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api/axios";
import SkeletonRoomCard from "../../components/ui/SkeletonRoomCard";
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

function Thumb({ src }) {
  return src ? <img src={src} alt="" loading="lazy" /> : <Sofa size={26} />;
}

function FurnitureList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("rent");
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [d, setD] = useState({ mode: "rent", months: 6, cond: "new", qty: 1 });
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", area: "", date: "" });

  useEffect(() => {
    api
      .get("/furniture")
      .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Furniture fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter(
      (i) => (cat === "all" || i.category === cat) && (!s || i.name.toLowerCase().includes(s))
    );
  }, [items, cat, q]);

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

  const sendWhatsApp = () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!form.name.trim()) return toast.error("Please enter your name");
    if (!/^\d{10}$/.test(form.phone.replace(/\D/g, "").slice(-10))) return toast.error("Enter a valid 10 digit phone number");
    if (!form.area) return toast.error("Please choose your area");

    const lines = cart.map(
      (l, i) =>
        `${i + 1}. ${l.qty}x ${l.name} (${variantText(l)}) - ${fmt(l.unit)}${l.mode === "rent" ? "/month" : ""}`
    );
    const msg = [
      "Hi RoomSlider, I want to request furniture/appliances:",
      "",
      ...lines,
      "",
      `Monthly rent: ${fmt(totals.rentMonthly)}`,
      `Security deposit (refundable): ${fmt(totals.deposit)}`,
      `Buy total: ${fmt(totals.buyTotal)}`,
      `Delivery: ${fmt(totals.delivery)}`,
      `Initial payment: ${fmt(totals.initial)}`,
      "",
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      `Area: ${form.area}, Indore`,
      form.date ? `Preferred delivery date: ${form.date}` : "",
    ].join("\n");

    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const renderCart = () => (
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
          <input className="fu-input" placeholder="Your name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="fu-input" placeholder="Phone number" inputMode="numeric" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <select className="fu-input" value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}>
            <option value="">Choose your area in Indore</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <input className="fu-input" type="date" value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })} />

          <h4>Order Total</h4>
          {totals.rentMonthly > 0 && <div className="fu-row"><span>Monthly rent</span><span>{fmt(totals.rentMonthly)}</span></div>}
          {totals.deposit > 0 && <div className="fu-row"><span>Deposit (refundable)</span><span>{fmt(totals.deposit)}</span></div>}
          {totals.buyTotal > 0 && <div className="fu-row"><span>Buy total</span><span>{fmt(totals.buyTotal)}</span></div>}
          {totals.delivery > 0 && <div className="fu-row"><span>Delivery</span><span>{fmt(totals.delivery)}</span></div>}
          <div className="fu-row total"><span>Initial payment</span><span>{fmt(totals.initial)}</span></div>

          <button type="button" className="fu-wa" onClick={sendWhatsApp}>
            <MessageCircle size={18} /> Request on WhatsApp
          </button>
          <p className="fu-muted" style={{ textAlign: "center", margin: "8px 0 0" }}>Confirm and start chat</p>
        </>
      )}
    </div>
  );

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
                      {out ? <span className="fu-tag out">Out of stock</span> : item.badge ? <span className="fu-tag">{item.badge}</span> : null}
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
