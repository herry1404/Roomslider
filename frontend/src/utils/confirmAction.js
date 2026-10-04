export default function confirmAction(message, options = {}) {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent("roomslider:confirm", {
      detail: { message, options, resolve },
    }));
  });
}
