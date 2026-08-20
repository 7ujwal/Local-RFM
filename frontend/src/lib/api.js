import axios from "axios";

const backend = (
  process.env.REACT_APP_BACKEND_URL ||
  (process.env.NODE_ENV === "production" ? "" : "http://localhost:8000")
).replace(/\/$/, "");

export const API = `${backend}/api`;

export const api = axios.create({ baseURL: API, withCredentials: true });

export const BRAND = {
  logo: "https://customer-assets-4nw71qhi.emergentagent.net/wingman/e7672571-b80f-42cc-8891-a0a14036e307/attachments/c953f13eb1984f489e82f2015110e910_703F60F8-2A85-4C93-AE36-0744C79D9970.jpeg",
  badge: "/brand-badge.png",
  banner: "https://customer-assets-4nw71qhi.emergentagent.net/wingman/e7672571-b80f-42cc-8891-a0a14036e307/attachments/0c8932fab4bc4605b13dc6cda24c8289_ChatGPT Image Jul 5%2C 2026%2C 11_38_51 PM.png",
  instagram: "https://www.instagram.com/roamingfromrohru/",
  video: "https://upload.wikimedia.org/wikipedia/commons/d/d2/Beautiful_footage_of_the_Himalayas.webm",
};

export const imgUrl = (u) =>
  u && u.startsWith("/api/") ? `${backend}${u}` : u;

export const INR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
