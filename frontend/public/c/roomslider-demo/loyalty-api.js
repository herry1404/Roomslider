(function () {
  "use strict";
  var apiHost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://roomslider-api.onrender.com";

  window.RoomSliderLoyalty = {
    baseUrl: apiHost + "/api/loyalty/roomslider-demo",
    request: async function (path, options) {
      var settings = options || {};
      var headers = { "Content-Type": "application/json" };
      if (settings.cardToken) headers["x-card-token"] = settings.cardToken;
      if (settings.staffPin) headers["x-staff-pin"] = settings.staffPin;
      var response = await fetch(this.baseUrl + path, {
        method: settings.method || "GET",
        headers: headers,
        body: settings.body ? JSON.stringify(settings.body) : undefined
      });
      var data = await response.json().catch(function () { return {}; });
      if (!response.ok) {
        var error = new Error(data.message || "Request could not be completed.");
        error.status = response.status;
        error.code = data.code || "";
        throw error;
      }
      return data;
    }
  };
})();
