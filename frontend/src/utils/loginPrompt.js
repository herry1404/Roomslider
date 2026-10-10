export function requestLogin(message) {
  window.dispatchEvent(new CustomEvent("roomslider:login-required", {
    detail: { message },
  }));
}
