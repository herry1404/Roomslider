import { useState } from "react";

export default function SavingsCalculator() {
  const [rent, setRent] = useState(15000);

  const brokerFee = rent;
  const markup = Math.round(rent * 0.2);
  const brokerTotal = rent + brokerFee + markup;
  const roomsliderTotal = rent;
  const savings = brokerTotal - roomsliderTotal;
  const savingsPercent = Math.round((savings / brokerTotal) * 100);

  const formatRupee = (amount) => "₹" + Math.round(amount).toLocaleString("en-IN");

  return (
    <>
      <style>{`
        .sc-wrapper {
          background: var(--color-surface-2);
          color: var(--color-text);
          border-radius: 16px;
          padding: 24px;
          max-width: 600px;
          margin: 0 auto;
        }
        .sc-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sc-subtitle {
          font-size: 14px;
          color: var(--color-text-light);
          margin: 0 0 20px;
        }
        .sc-slider-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .sc-slider-label {
          font-size: 14px;
          color: var(--color-text-light);
          white-space: nowrap;
        }
        .sc-slider-row input[type="range"] {
          flex: 1;
        }
        .sc-slider-value {
          font-size: 15px;
          font-weight: 600;
          min-width: 78px;
          text-align: right;
        }
        .sc-cards {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          margin-bottom: 16px;
        }
        .sc-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 14px 16px;
        }
        .sc-card-label {
          font-size: 12px;
          color: var(--color-text-light);
          margin: 0 0 4px;
        }
        .sc-card-value {
          font-size: 22px;
          font-weight: 600;
          margin: 0;
        }
        .sc-broker-value { color: var(--color-error); }
        .sc-rs-value { color: var(--color-primary); }
        .sc-savings-box {
          background: color-mix(in srgb, var(--color-primary) 15%, transparent);
          border-radius: 10px;
          padding: 14px 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
        }
        .sc-savings-label {
          font-size: 14px;
          color: var(--color-primary-hover);
        }
        .sc-savings-value {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-primary-hover);
        }
        .sc-cta {
          width: 100%;
          padding: 12px;
          font-size: 15px;
          font-weight: 600;
          background: var(--color-primary);
          color: var(--color-background);
          border: none;
          border-radius: 10px;
          cursor: pointer;
        }
        .sc-cta:hover {
          background: var(--color-primary-hover);
        }

        /* Laptop / desktop view — screen 768px se bada */
        @media (min-width: 768px) {
          .sc-wrapper {
            padding: 32px 36px;
            max-width: 720px;
          }
          .sc-title {
            font-size: 24px;
          }
          .sc-cards {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .sc-card {
            padding: 18px 20px;
          }
          .sc-card-value {
            font-size: 26px;
          }
          .sc-savings-value {
            font-size: 24px;
          }
          .sc-cta {
            max-width: 280px;
            margin: 0 auto;
            display: block;
          }
        }
      `}</style>

      <div className="sc-wrapper">
        <p className="sc-title">Kitna bachaoge, dekho</p>
        <p className="sc-subtitle">
          Broker se kitna zyada dena padta, RoomSlider pe kitna bachega
        </p>

        <div className="sc-slider-row">
          <span className="sc-slider-label">Monthly rent</span>
          <input
            type="range"
            min="3000"
            max="50000"
            step="500"
            value={rent}
            onChange={(e) => setRent(Number(e.target.value))}
          />
          <span className="sc-slider-value">{formatRupee(rent)}</span>
        </div>

        <div className="sc-cards">
          <div className="sc-card">
            <p className="sc-card-label">Broker ke saath</p>
            <p className="sc-card-value sc-broker-value">{formatRupee(brokerTotal)}</p>
          </div>
          <div className="sc-card">
            <p className="sc-card-label">RoomSlider pe</p>
            <p className="sc-card-value sc-rs-value">{formatRupee(roomsliderTotal)}</p>
          </div>
        </div>

        <div className="sc-savings-box">
          <span className="sc-savings-label">Total bachat</span>
          <span className="sc-savings-value">
            {formatRupee(savings)} ({savingsPercent}%)
          </span>
        </div>

        <button
          className="sc-cta"
          onClick={() => (window.location.href = "/listings")}
        >
          RoomSlider pe listing dekho →
        </button>
      </div>
    </>
  );
}
