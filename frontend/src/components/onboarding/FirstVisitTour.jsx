import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, X } from "lucide-react";
import "../../styles/first-visit-tour.css";

const TOUR_KEY = "roomslider:first-visit-tour-complete";

function getSteps() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const accountStep = {
    target: '[data-tour="account"]',
    title: "Login and your account",
    description: "Tap here to log in or sign up. After login, find your profile, wishlist and recently viewed listings here.",
  };
  const exploreStep = {
    target: isMobile ? '[data-tour="explore"]' : '[data-tour="categories"]',
    title: isMobile ? "Explore services and more" : "Explore places to stay",
    description: isMobile
      ? "Tap Explore in the bottom bar to find roommates, food, laundry, vehicle rental, furniture, services and more."
      : "Browse Rooms, PGs, Hostels and Flats from these categories, then open any listing for details.",
  };

  return [
    ...(isMobile ? [exploreStep, accountStep] : [accountStep, exploreStep]),
    {
      target: '[data-tour="hourly-stays"]',
      title: "Hourly and short stays",
      description: "Scroll down to find rooms you can book by the hour or for a short stay.",
    },
    {
      target: '[data-tour="wishlist"]',
      title: "Save a listing",
      description: "Tap the heart on a listing to save it. Log in first, then find saved places in your account menu.",
    },
  ];
}

function getVisibleTarget(selector) {
  const elements = [...document.querySelectorAll(selector)];
  return elements.find((element) => {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return style.display !== "none" &&
      style.visibility !== "hidden" &&
      rect.width > 0 &&
      rect.height > 0;
  }) || null;
}

function FirstVisitTour() {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [placement, setPlacement] = useState(null);
  const cardRef = useRef(null);
  const steps = useMemo(() => getSteps(), []);
  const step = steps[stepIndex];

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "1");
    setActive(false);
  }, []);

  useEffect(() => {
    if (localStorage.getItem(TOUR_KEY)) return undefined;
    const timeoutId = window.setTimeout(() => setActive(true), 900);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, finish]);

  useEffect(() => {
    if (!active) return undefined;
    const target = getVisibleTarget(step.target);

    if (target) {
      const rect = target.getBoundingClientRect();
      if (rect.top < 16 || rect.bottom > window.innerHeight - 16) {
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      }
    }

    let frameId;
    const updatePlacement = () => {
      const currentTarget = getVisibleTarget(step.target);
      const targetRect = currentTarget?.getBoundingClientRect();
      const cardRect = cardRef.current?.getBoundingClientRect();

      if (!cardRect) {
        frameId = window.requestAnimationFrame(updatePlacement);
        return;
      }

      if (!targetRect) {
        setPlacement({
          spotlight: null,
          top: Math.max(16, (window.innerHeight - cardRect.height) / 2),
          left: Math.max(16, (window.innerWidth - cardRect.width) / 2),
          arrow: null,
        });
        return;
      }

      const spaceBelow = window.innerHeight - targetRect.bottom;
      const placeBelow = spaceBelow >= cardRect.height + 28 || targetRect.top < cardRect.height + 28;
      const top = placeBelow
        ? Math.min(window.innerHeight - cardRect.height - 16, targetRect.bottom + 18)
        : Math.max(16, targetRect.top - cardRect.height - 18);
      const left = Math.max(
        16,
        Math.min(
          targetRect.left + targetRect.width / 2 - cardRect.width / 2,
          window.innerWidth - cardRect.width - 16
        )
      );
      const arrowX = Math.max(
        24,
        Math.min(targetRect.left + targetRect.width / 2 - left, cardRect.width - 24)
      );
      const radius = Math.ceil(Math.hypot(targetRect.width, targetRect.height) / 2 + 16);

      setPlacement({
        spotlight: {
          x: `${targetRect.left + targetRect.width / 2}px`,
          y: `${targetRect.top + targetRect.height / 2}px`,
          radius: `${radius}px`,
          left: `${targetRect.left}px`,
          top: `${targetRect.top}px`,
          width: `${targetRect.width}px`,
          height: `${targetRect.height}px`,
        },
        top,
        left,
        arrowX,
        arrow: placeBelow ? "up" : "down",
      });
    };

    frameId = window.requestAnimationFrame(updatePlacement);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [active, step]);

  const goToStep = (index) => {
    if (index >= steps.length) {
      finish();
      return;
    }
    setPlacement(null);
    setStepIndex(index);
  };

  if (!active) return null;

  const Arrow = placement?.arrow === "up" ? ArrowUp : ArrowDown;

  return (
    <div
      className="first-visit-tour"
      style={placement?.spotlight ? {
        "--tour-spotlight-x": placement.spotlight.x,
        "--tour-spotlight-y": placement.spotlight.y,
        "--tour-spotlight-radius": placement.spotlight.radius,
      } : undefined}
      role="presentation"
    >
      {placement?.spotlight && (
        <div
          className="first-visit-tour-spotlight"
          style={{
            left: placement.spotlight.left,
            top: placement.spotlight.top,
            width: placement.spotlight.width,
            height: placement.spotlight.height,
          }}
          aria-hidden="true"
        />
      )}
      <section
        ref={cardRef}
        className="first-visit-tour-card"
        style={placement ? {
          top: placement.top,
          left: placement.left,
          "--tour-arrow-x": `${placement.arrowX || 24}px`,
        } : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-visit-tour-title"
        aria-describedby="first-visit-tour-description"
      >
        <button className="first-visit-tour-close" type="button" onClick={finish} aria-label="Close tour">
          <X size={18} />
        </button>
        {placement?.arrow && (
          <span className={`first-visit-tour-arrow ${placement.arrow}`} aria-hidden="true">
            <Arrow size={22} />
          </span>
        )}
        <p className="first-visit-tour-count">FEATURE GUIDE · {stepIndex + 1} OF {steps.length}</p>
        <h2 id="first-visit-tour-title">{step.title}</h2>
        <p id="first-visit-tour-description">{step.description}</p>
        <div className="first-visit-tour-actions">
          <button className="first-visit-tour-skip" type="button" onClick={finish}>Skip guide</button>
          <div>
            {stepIndex > 0 && (
              <button className="first-visit-tour-back" type="button" onClick={() => goToStep(stepIndex - 1)}>
                <ChevronLeft size={17} /> Back
              </button>
            )}
            <button className="first-visit-tour-next" type="button" onClick={() => goToStep(stepIndex + 1)}>
              {stepIndex === steps.length - 1 ? "Got it" : "Next"}
              {stepIndex < steps.length - 1 && <ChevronRight size={17} />}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FirstVisitTour;
