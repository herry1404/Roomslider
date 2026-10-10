let razorpayScriptPromise;

export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        razorpayScriptPromise = undefined;
        reject(new Error("Razorpay checkout did not initialize"));
      }
    };
    script.onerror = () => {
      razorpayScriptPromise = undefined;
      reject(new Error("Razorpay checkout failed to load"));
    };
    document.head.appendChild(script);
  });

  return razorpayScriptPromise;
}
