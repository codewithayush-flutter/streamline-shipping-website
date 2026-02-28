console.log("🔥 THIS SERVER FILE IS RUNNING 🔥");

import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ Log every request (helps debugging)
app.use((req, res, next) => {
  console.log("REQ:", req.method, req.url);
  next();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve Public folder
const publicDir = path.join(__dirname, "..", "Public");
app.use(express.static(publicDir));

// ✅ Force homepage to load index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ---- Helpers ----
const clean = (v, max = 2000) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

const isEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");

// ---- Mail transporter (Gmail) ----
// ✅ SMTP_PASS MUST be Gmail App Password (16 digits)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ✅ Check mail setup when server starts
transporter.verify((err) => {
  if (err) console.log("MAIL VERIFY ERROR:", err);
  else console.log("MAIL READY ✅");
});

// ✅ QUOTE API
app.post("/api/quote", async (req, res) => {
  try {
    console.log("QUOTE HIT ✅", req.body);

    const name = clean(req.body.name, 80);
    const phone = clean(req.body.phone, 30);
    const pickup = clean(req.body.pickup, 120);
    const destination = clean(req.body.destination, 120);
    const serviceType = clean(req.body.serviceType, 60);

    if (!name || !phone || !pickup || !destination || !serviceType) {
      return res.status(400).json({ ok: false, message: "Fill all quote fields." });
    }

    const info = await transporter.sendMail({
      from: `"Streamline Shipping Website" <${process.env.SMTP_USER}>`,
      to: process.env.TO_EMAIL,
      subject: `New Quote Request - ${serviceType}`,
      html: `
        <h2>New Quote Request</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Pickup:</b> ${pickup}</p>
        <p><b>Destination:</b> ${destination}</p>
        <p><b>Service:</b> ${serviceType}</p>
      `,
    });

    console.log("MAIL SENT:", info.response);

    res.json({ ok: true, message: "Quote request sent ✅" });
  } catch (err) {
    console.log("MAIL ERROR:", err);
    res.status(500).json({ ok: false, message: "Email failed (check App Password)." });
  }
});

// ✅ CONTACT API
app.post("/api/contact", async (req, res) => {
  try {
    console.log("CONTACT HIT ✅", req.body);

    const name = clean(req.body.name, 80);
    const email = clean(req.body.email, 120);
    const message = clean(req.body.message, 2000);

    if (!name || !email || !message) {
      return res.status(400).json({ ok: false, message: "Fill all contact fields." });
    }
    if (!isEmail(email)) {
      return res.status(400).json({ ok: false, message: "Enter a valid email." });
    }

    const info = await transporter.sendMail({
      from: `"Streamline Shipping Website" <${process.env.SMTP_USER}>`,
      to: process.env.TO_EMAIL,
      replyTo: email,
      subject: `New Contact Message - ${name}`,
      html: `
        <h2>New Contact Message</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Message:</b><br>${message.replaceAll("\n", "<br>")}</p>
      `,
    });

    console.log("MAIL SENT:", info.response);

    res.json({ ok: true, message: "Message sent ✅" });
  } catch (err) {
    console.log("MAIL ERROR:", err);
    res.status(500).json({ ok: false, message: "Email failed (check App Password)." });
  }
});

// ✅ Fallback: if someone opens /anything, return index.html (SPA-style)
app.get("*", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ✅ Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});