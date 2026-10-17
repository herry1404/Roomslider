export function isProfileComplete(user) {
  if (!user) return false;
  const phone = String(user.phone || "").replace(/\D/g, "").slice(-10);
  const required = [user.name, phone, user.occupation, user.city, user.area];
  if (required.some((value) => !String(value || "").trim())) return false;
  if (!/^[6-9]\d{9}$/.test(phone)) return false;
  if (user.occupation === "student") {
    return [user.organization, user.course, user.subject, user.studyYear]
      .every((value) => String(value || "").trim());
  }
  return true;
}
