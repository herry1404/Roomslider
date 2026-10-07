import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

export async function getCurrentPosition(options) {
  if (Capacitor.isNativePlatform()) {
    const permission = await Geolocation.checkPermissions();
    if (permission.location !== "granted") {
      const requested = await Geolocation.requestPermissions({ permissions: ["location"] });
      if (requested.location !== "granted") {
        throw new Error("Location permission was not granted");
      }
    }

    return Geolocation.getCurrentPosition(options);
  }

  if (!navigator.geolocation) {
    throw new Error("Location is not available on this device");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}
