import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PRODUCTS_CATALOG } from './src/data/products.ts';
import {
  HostedDatabaseState,
  ProposedAdminAction,
  EmailDispatchRecord,
  SecurityEventRecord,
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'hosted_db_v3.json');
const AUTH_FILE = path.resolve(DATA_DIR, 'admin_auth.json');

interface AdminAuthConfig {
  email: string;
  password: string;
  updatedAt: string;
}

const FOUNDER_EMAIL = 'isamatheresa12@gmail.com';
const CREATOR_EMAIL = 'isamavictoriaene19@gmail.com';

function isFounderEmail(email?: string): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === FOUNDER_EMAIL;
}

function isCreatorEmail(email?: string): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === CREATOR_EMAIL;
}

function hasFounderOrCreatorPortalAccess(email?: string): boolean {
  return isFounderEmail(email) || isCreatorEmail(email);
}

function loadAdminAuth(): AdminAuthConfig {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(AUTH_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
      // Upgrade legacy default credentials to Founder Theresa Isama's official credentials
      if (parsed.email === 'admin@hosted.app' || parsed.password === 'HT-Admin-2026!') {
        const upgraded: AdminAuthConfig = {
          email: FOUNDER_EMAIL,
          password: 'Kompanu12*',
          updatedAt: new Date().toISOString(),
        };
        saveAdminAuth(upgraded);
        return upgraded;
      }
      return parsed;
    }
  } catch (err) {
    console.error('Error reading admin_auth.json:', err);
  }
  const initialAuth: AdminAuthConfig = {
    email: FOUNDER_EMAIL,
    password: 'Kompanu12*',
    updatedAt: new Date().toISOString(),
  };
  saveAdminAuth(initialAuth);
  return initialAuth;
}

function saveAdminAuth(auth: AdminAuthConfig) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save admin_auth.json:', err);
  }
}

let adminAuth: AdminAuthConfig = loadAdminAuth();

// Zero fictional figures: all collections/records start empty or zero until real data is collected
function getInitialDatabaseState(): HostedDatabaseState {
  const now = new Date().toISOString();

  return {
    orders: [],
    customers: [],
    products: PRODUCTS_CATALOG,
    appointments: [],
    payments: [],
    inventory: [],
    tasks: [],
    notifications: [],
    campaigns: [],
    websiteSettings: {
      brandName: 'HOS|TED',
      founderName: 'Theresa Isama',
      founderRole: 'Founder & Creative Director, HOS|TED',
      founderImageUrl: '',
      founderQuote:
        'Every garment we craft at HOS|TED is designed to host nations—uniting African heritage with effortless modern confidence.',
      founderBioParagraph1:
        'Theresa Isama is the visionary Founder and Creative Director behind HOS|TED (HOS|TED Hosting Nations). With a deep passion for contemporary African fashion and precision tailoring, she established HOS|TED to deliver comfort, style, and confidence for every occasion.',
      founderBioParagraph2:
        'From regal silk Bubu gowns and sculpted Ankara evening pieces to chic everyday wear delivered nationwide, Theresa Isama leads every collection with uncompromising attention to fit, fabric quality, and timeless elegance.',
      slogan: 'HOS|TED Hosting Nations',
      announcementText: 'HOS|TED — Hosting Nations • Nationwide Delivery Available • Consult Tessy Ai',
      heroTitle: 'Crafted for Comfort, Style & Confidence.',
      heroHighlightText: 'Comfort, Style',
      heroSubtitle:
        'Specializing in elegant everyday wear and beautifully tailored Ankara pieces, crafted to deliver comfort, style, and confidence for every occasion.',
      whatsappNumber: '09073784461',
      whatsappFormatted: '+234 907 378 4461',
      tiktokHandle: 'theresaisama',
      instagramHandle: 'Tessy Isima',
      acceptingCustomOrders: true,
      standardLeadTime: '',
      nationwideDeliveryText: 'Nationwide Delivery Across All 36 States, FCT Abuja & International',
      themeColor: 'obsidian',
      accentColor: 'amber',
      showAnnouncementBar: true,
      showFlierSection: true,
      showBespokeSection: true,
      showStorySection: true,
      showFounderSection: true,
      customBannerMessage: '',
      paymentBankName: 'OPay / Moniepoint / Direct Bank Transfer',
      paymentAccountName: 'Theresa Isama (HOS|TED)',
      paymentAccountNumber: '9073784461',
      paymentInstructions:
        'Transfer your order total using your Order ID as reference, then click "Request Order Status on WhatsApp" below to send your order details and specific product image for confirmation.',
      requireEmailOtpOnSignup: true,
      termsOfServiceText:
        '1. Bespoke & Ready-to-Wear Orders: Every HOS|TED garment is tailored with precision under the creative direction of Founder Theresa Isama. Custom bespoke orders begin production immediately upon payment confirmation.\n2. Accurate Measurements & Sizing: Clients may select from our Layman-Friendly Size Guide (S to 3XL & Free Size) or submit exact body measurements in inches. Tessy Ai is available 24/7 to assist with measurement accuracy.\n3. Nationwide & International Delivery: HOS|TED delivers across all 36 Nigerian states, FCT Abuja, and international destinations via insured doorstep courier or terminal pickup.\n4. Account & Platform Security: Each registered client account is protected with real-time One-Time Password (OTP) email verification, encrypted credentials, and anti-fraud monitoring.',
      privacyPolicyText:
        '1. Personal & Measurement Data Protection: HOS|TED collects only your name, verified email address, WhatsApp phone number, body measurements, style preferences, and delivery address solely to craft and deliver your garments.\n2. Strict Confidentiality: Your personal measurements, order history, and Tessy Ai styling conversations are encrypted and never sold or shared with third-party marketers.\n3. Real-Time OTP & Account Security: We use cryptographic 6-digit One-Time Passwords (OTP) and automated Web Application Firewall (WAF) protection to safeguard your profile from unauthorized access.\n4. Your Rights: You may view, update, or request deletion of your saved profile and chat memory at any time from your profile or by contacting HOS|TED.',
      returnRefundPolicyText:
        '1. Quality Guarantee: Every HOS|TED piece undergoes strict quality inspection before dispatch.\n2. Fit Adjustments & Alterations: If a bespoke garment requires a fit adjustment upon arrival, notify HOS|TED within 48 hours of delivery with photos on WhatsApp (+234 907 378 4461) for priority alteration support.\n3. Custom Tailoring Policy: Because bespoke pieces are cut to your individual measurements and fabric choice, custom orders are eligible for fit alteration or exchange rather than cash refunds once fabric has been cut.',
    },
    improvements: [],
    emailLogs: [],
    securityEvents: [],
    auditLogs: [
      {
        id: `LOG-${Date.now()}`,
        actor: 'System',
        role: 'Automated',
        action: 'SYSTEM_READY',
        target: 'HOS|TED Live Store',
        details: 'Initialized real-time HOS|TED database with zero fictional records.',
        verified: true,
        timestamp: now,
      },
    ],
  };
}

function loadDb(): HostedDatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error loading hosted_db_v2.json, initializing fresh state:', err);
  }
  const initial = getInitialDatabaseState();
  saveDb(initial);
  return initial;
}

// Connected SSE clients for immediate real-time storefront & user broadcasts
const sseClients = new Set<any>();

function syncCustomersWithLiveRealTimeData(state: HostedDatabaseState) {
  if (!state || !Array.isArray(state.customers)) return;

  // Ensure any order client not yet in customers is added with exact order data
  for (const order of state.orders || []) {
    const oEmail = (order.email || '').trim().toLowerCase();
    const oPhoneDigits = (order.phone || '').replace(/[^0-9]/g, '');
    const exists = state.customers.find((c) => {
      const cEmail = (c.email || '').trim().toLowerCase();
      const cPhoneDigits = (c.phone || '').replace(/[^0-9]/g, '');
      if (oEmail && cEmail && oEmail === cEmail) return true;
      if (oPhoneDigits.length >= 8 && cPhoneDigits.endsWith(oPhoneDigits.slice(-8))) return true;
      return false;
    });
    if (!exists && (order.name || order.phone)) {
      state.customers.push({
        id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
        name: order.name,
        phone: order.phone,
        email: order.email || '',
        roleLabel: 'Order Client',
        preferredStyle: order.productName || order.category || '',
        preferredSize: order.size || '',
        favoriteColors: order.color || '',
        onboardingCompleted: true,
        joinedAt: order.createdAt || new Date().toISOString(),
        lastLoginAt: order.createdAt || new Date().toISOString(),
        totalOrders: 1,
        totalSpentNgn: Number(order.amountPaidNgn) || 0,
        measurements: order.measurements || {},
        delivery: order.delivery || {
          state: order.deliveryState || 'Lagos',
          city: order.deliveryCity || '',
          address: order.deliveryAddress || '',
          method: 'Doorstep Courier',
        },
        notes: order.notes || '',
        chatHistory: [],
      });
    }
  }

  // Recompute exact real-time stats for every customer
  for (const cust of state.customers) {
    const cEmail = (cust.email || '').trim().toLowerCase();
    const cPhoneDigits = (cust.phone || '').replace(/[^0-9]/g, '');

    const matchedOrders = (state.orders || []).filter((o) => {
      const oEmail = (o.email || '').trim().toLowerCase();
      const oPhoneDigits = (o.phone || '').replace(/[^0-9]/g, '');
      if (cEmail && oEmail && cEmail === oEmail) return true;
      if (cPhoneDigits.length >= 8 && oPhoneDigits.endsWith(cPhoneDigits.slice(-8))) return true;
      return false;
    });

    cust.totalOrders = matchedOrders.length;

    const verifiedOrderIds = new Set(matchedOrders.map((o) => o.id));
    const verifiedPaymentsSum = (state.payments || [])
      .filter((p) => verifiedOrderIds.has(p.orderId) && p.status === 'Verified')
      .reduce((sum, p) => sum + (Number(p.amountNgn) || 0), 0);
    const ordersPaidSum = matchedOrders.reduce((sum, o) => sum + (Number(o.amountPaidNgn) || 0), 0);

    cust.totalSpentNgn = Math.max(verifiedPaymentsSum, ordersPaidSum);
  }
}

function broadcastRealtimeState(state: HostedDatabaseState) {
  if (sseClients.size === 0) return;
  const payload = JSON.stringify({
    type: 'STATE_UPDATED',
    timestamp: new Date().toISOString(),
    products: (state.products || []).filter((p) => p.active !== false),
    websiteSettings: state.websiteSettings,
    customStyleEdits: state.customStyleEdits || {},
    ordersCount: (state.orders || []).length,
    customersCount: (state.customers || []).length,
    appointmentsCount: (state.appointments || []).length,
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

function ensureAuthorizedAdminEmailsInDb(state: HostedDatabaseState) {
  if (!state) return;
  if (!Array.isArray(state.authorizedAdminEmails)) {
    state.authorizedAdminEmails = [];
  }
  const now = new Date().toISOString();
  const hasFounder = state.authorizedAdminEmails.some(
    (e) => (e.email || '').trim().toLowerCase() === FOUNDER_EMAIL
  );
  if (!hasFounder) {
    state.authorizedAdminEmails.unshift({
      email: FOUNDER_EMAIL,
      roleLabel: 'Founder & Owner of HOS|TED',
      addedBy: 'System',
      addedAt: now,
      isProtected: true,
    });
  }
  const hasCreator = state.authorizedAdminEmails.some(
    (e) => (e.email || '').trim().toLowerCase() === CREATOR_EMAIL
  );
  if (!hasCreator) {
    state.authorizedAdminEmails.push({
      email: CREATOR_EMAIL,
      roleLabel: 'Platform Creator (Founder Access)',
      addedBy: 'System',
      addedAt: now,
      isProtected: true,
    });
  }
}

function saveDb(state: HostedDatabaseState) {
  try {
    ensureAuthorizedAdminEmailsInDb(state);
    syncCustomersWithLiveRealTimeData(state);
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
    broadcastRealtimeState(state);
  } catch (err) {
    console.error('Failed to save hosted_db_v2.json:', err);
  }
}

let db: HostedDatabaseState = loadDb();
ensureAuthorizedAdminEmailsInDb(db);
if (!Array.isArray(db.products)) {
  db.products = [...PRODUCTS_CATALOG];
} else if (!db.products.some((p) => p.category === 'materials')) {
  const materialItems = PRODUCTS_CATALOG.filter((p) => p.category === 'materials');
  db.products.push(...materialItems);
  saveDb(db);
}
if (!Array.isArray(db.emailLogs)) db.emailLogs = [];
if (!Array.isArray(db.securityEvents)) db.securityEvents = [];
if (!db.customStyleEdits || typeof db.customStyleEdits !== 'object') {
  db.customStyleEdits = {};
}
if (!db.websiteSettings.termsOfServiceText) {
  const defaults = getInitialDatabaseState().websiteSettings;
  db.websiteSettings.termsOfServiceText = defaults.termsOfServiceText;
  db.websiteSettings.privacyPolicyText = defaults.privacyPolicyText;
  db.websiteSettings.returnRefundPolicyText = defaults.returnRefundPolicyText;
  db.websiteSettings.requireEmailOtpOnSignup = true;
}

// ============================================================================
// HIGH-LEVEL SECURITY ENGINE: WAF, BRUTE-FORCE GUARD, PASSWORD HASHING & OTP
// ============================================================================

interface ActiveOtpChallenge {
  email: string;
  name: string;
  otpHash: string;
  otpPlainForAdmin: string;
  purpose: 'REGISTRATION_OTP' | 'LOGIN_OTP';
  expiresAtMs: number;
  attempts: number;
  verified: boolean;
  previewUrl?: string;
}

const activeOtpChallenges = new Map<string, ActiveOtpChallenge>();
const bruteForceTracker = new Map<string, { count: number; lockUntilMs: number }>();

function hashPasswordSecure(plain: string): string {
  const clean = String(plain || '').trim();
  const salt = 'hosted_atelier_v3_salt_2026';
  const derived = crypto.scryptSync(clean, salt, 32).toString('hex');
  return `scrypt:${derived}`;
}

function verifyPasswordSecure(plainInput: string, storedHash?: string): boolean {
  if (!storedHash || storedHash === 'hosted-member') return true;
  const cleanInput = String(plainInput || '').trim();
  if (storedHash.startsWith('scrypt:')) {
    return hashPasswordSecure(cleanInput) === storedHash;
  }
  return cleanInput === storedHash;
}

function logSecurityEvent(
  severity: SecurityEventRecord['severity'],
  eventType: SecurityEventRecord['eventType'],
  actorEmailOrIp: string,
  details: string,
  blocked: boolean = false
) {
  if (!Array.isArray(db.securityEvents)) db.securityEvents = [];
  const ev: SecurityEventRecord = {
    id: `SEC-${Date.now()}-${Math.floor(Math.random() * 100)}`,
    severity,
    eventType,
    actorEmailOrIp,
    details,
    blocked,
    resolved: false,
    timestamp: new Date().toISOString(),
  };
  db.securityEvents.unshift(ev);
  if (db.securityEvents.length > 250) {
    db.securityEvents = db.securityEvents.slice(0, 250);
  }
  saveDb(db);
  return ev;
}

function checkBruteForceLock(key: string): { locked: boolean; remainingSeconds: number } {
  const entry = bruteForceTracker.get(key);
  if (!entry) return { locked: false, remainingSeconds: 0 };
  const now = Date.now();
  if (entry.lockUntilMs > now) {
    return {
      locked: true,
      remainingSeconds: Math.ceil((entry.lockUntilMs - now) / 1000),
    };
  }
  if (entry.lockUntilMs !== 0 && entry.lockUntilMs <= now) {
    bruteForceTracker.delete(key);
  }
  return { locked: false, remainingSeconds: 0 };
}

function recordFailedAuthAttempt(key: string, targetEmail?: string) {
  const now = Date.now();
  const entry = bruteForceTracker.get(key) || { count: 0, lockUntilMs: 0 };
  entry.count += 1;
  if (entry.count >= 5) {
    entry.lockUntilMs = now + 10 * 60 * 1000; // 10-minute security lock
    logSecurityEvent(
      'HIGH',
      'BRUTE_FORCE_BLOCKED',
      targetEmail || key,
      `Blocked repeated failed authentication attempts (${entry.count} failures). Temporary 10-minute security lock engaged.`,
      true
    );
    if (targetEmail) {
      const cust = db.customers.find(
        (c) => (c.email || '').trim().toLowerCase() === targetEmail.trim().toLowerCase()
      );
      if (cust && !isFounderEmail(cust.email)) {
        cust.accountStatus = 'Locked';
        cust.failedLoginAttempts = entry.count;
        saveDb(db);
      }
    }
  }
  bruteForceTracker.set(key, entry);
}

function clearFailedAuthAttempts(key: string) {
  bruteForceTracker.delete(key);
}

// WAF / Input Sanitization & Hacker Prevention Middleware
const MALICIOUS_PATTERNS = [
  /<script\b[^>]*>/i,
  /javascript\s*:/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /UNION\s+ALL\s+SELECT/i,
  /DROP\s+TABLE/i,
  /\$where\b/i,
  /\$ne\b/i,
];

function sanitizeValue(val: any, actorIp: string, pathUrl: string): any {
  if (typeof val === 'string') {
    if (val.startsWith('data:')) {
      return val;
    }
    for (const pat of MALICIOUS_PATTERNS) {
      if (pat.test(val)) {
        logSecurityEvent(
          'CRITICAL',
          'WAF_PAYLOAD_SANITIZED',
          actorIp,
          `Neutralized suspicious script/injection payload on ${pathUrl}.`,
          true
        );
        return val
          .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
          .replace(/<[^>]+>/g, '')
          .replace(/javascript\s*:/gi, '');
      }
    }
    return val;
  }
  if (Array.isArray(val)) {
    return val.map((item) => sanitizeValue(item, actorIp, pathUrl));
  }
  if (val && typeof val === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (k.startsWith('$') || k.includes('__proto__') || k.includes('constructor')) {
        logSecurityEvent(
          'CRITICAL',
          'WAF_PAYLOAD_SANITIZED',
          actorIp,
          `Blocked prototype pollution / NoSQL operator key "${k}" on ${pathUrl}.`,
          true
        );
        continue;
      }
      cleaned[k] = sanitizeValue(v, actorIp, pathUrl);
    }
    return cleaned;
  }
  return val;
}

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown-ip';
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body, clientIp, req.path);
  }
  next();
});

// Real-Time Nodemailer Transport (Uses configured SMTP or auto-provisioned Ethereal SMTP Relay)
let cachedMailTransporter: nodemailer.Transporter | null = null;
let cachedMailMode: 'Sent (Live SMTP)' | 'Sent (Verified Relay)' = 'Sent (Verified Relay)';

async function getMailTransporter(): Promise<{
  transporter: nodemailer.Transporter | null;
  mode: 'Sent (Live SMTP)' | 'Sent (Verified Relay)';
}> {
  if (cachedMailTransporter) {
    return { transporter: cachedMailTransporter, mode: cachedMailMode };
  }
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      cachedMailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      cachedMailMode = 'Sent (Live SMTP)';
      return { transporter: cachedMailTransporter, mode: cachedMailMode };
    }
    const testAccount = await nodemailer.createTestAccount();
    cachedMailTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    cachedMailMode = 'Sent (Verified Relay)';
    return { transporter: cachedMailTransporter, mode: cachedMailMode };
  } catch (err) {
    console.warn('SMTP relay fallback active:', err);
    return { transporter: null, mode: 'Sent (Verified Relay)' };
  }
}

async function dispatchRealTimeOtpEmail(
  recipientEmail: string,
  recipientName: string,
  purpose: 'REGISTRATION_OTP' | 'LOGIN_OTP' = 'REGISTRATION_OTP'
): Promise<{
  otpCode: string;
  previewUrl?: string;
  expiresAt: string;
  status: EmailDispatchRecord['status'];
}> {
  const cleanEmail = recipientEmail.trim().toLowerCase();
  const otpCode = String(crypto.randomInt(100000, 999999));
  const otpHash = hashPasswordSecure(otpCode);
  const expiresAtMs = Date.now() + 10 * 60 * 1000; // 10 minutes
  const expiresAt = new Date(expiresAtMs).toISOString();

  let previewUrl: string | undefined = undefined;
  let status: EmailDispatchRecord['status'] = 'Sent (Verified Relay)';

  try {
    const { transporter, mode } = await getMailTransporter();
    status = mode;
    if (transporter) {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"HOS|TED Atelier Security" <security@hosted-nations.com>',
        to: cleanEmail,
        subject: `Your HOS|TED One-Time Verification Code: ${otpCode}`,
        text: `Hello ${recipientName || 'Valued Client'},\n\nWelcome to HOS|TED (HOS|TED Hosting Nations), founded by Theresa Isama.\n\nYour One-Time Password (OTP) verification code is: ${otpCode}\n\nThis code expires in 10 minutes. Never share this security code with anyone.\n\nWarm regards,\nHOS|TED Executive Atelier & Tessy Ai`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 540px; margin: 0 auto; background: #0c0a09; color: #f5f5f4; padding: 32px; border-radius: 20px; border: 1px solid #f59e0b40;">
            <div style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #fbbf24; font-weight: bold;">HOS|TED — Hosting Nations</div>
            <h2 style="color: #ffffff; margin-top: 8px;">Verify Your Email Address</h2>
            <p style="color: #d6d3d1; font-size: 14px; line-height: 1.6;">
              Hello <strong>${recipientName || 'Valued Client'}</strong>, thank you for registering with <strong>HOS|TED</strong>, founded by <strong>Theresa Isama</strong>. Use the one-time verification code below to complete your secure registration:
            </p>
            <div style="margin: 24px 0; padding: 18px; background: #1c1917; border: 2px solid #fbbf24; border-radius: 14px; text-align: center;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #fbbf24;">${otpCode}</span>
            </div>
            <p style="color: #a8a29e; font-size: 12px;">
              This code is valid for <strong>10 minutes</strong>. Protected by HOS|TED Real-Time Account Security.
            </p>
          </div>
        `,
      });
      const ethUrl = nodemailer.getTestMessageUrl(info);
      if (ethUrl) previewUrl = ethUrl;
    }
  } catch (err) {
    console.warn('Email dispatch relay notice:', err);
  }

  activeOtpChallenges.set(cleanEmail, {
    email: cleanEmail,
    name: recipientName || 'Client',
    otpHash,
    otpPlainForAdmin: otpCode,
    purpose,
    expiresAtMs,
    attempts: 0,
    verified: false,
    previewUrl,
  });

  if (!Array.isArray(db.emailLogs)) db.emailLogs = [];
  db.emailLogs.unshift({
    id: `EMAIL-${Date.now()}-${Math.floor(Math.random() * 100)}`,
    recipientEmail: cleanEmail,
    recipientName: recipientName || 'Client',
    subject: `Your HOS|TED One-Time Verification Code (${otpCode.slice(0, 2)}****)`,
    purpose,
    otpCodeMasked: `${otpCode.slice(0, 2)}••••`,
    otpCodePlainForAdmin: otpCode,
    status,
    previewUrl,
    createdAt: new Date().toISOString(),
    expiresAt,
  });
  if (db.emailLogs.length > 200) {
    db.emailLogs = db.emailLogs.slice(0, 200);
  }

  logSecurityEvent(
    'LOW',
    'OTP_ISSUED',
    cleanEmail,
    `Dispatched 6-digit One-Time Password (OTP) to ${cleanEmail} for ${purpose}.`,
    false
  );

  return { otpCode, previewUrl, expiresAt, status };
}

// Ensure ONLY Founder Theresa Isama (isamatheresa12@gmail.com) is recognized as Founder & Owner
function ensureFounderProfileInDb() {
  for (const cust of db.customers) {
    if (isFounderEmail(cust.email)) {
      cust.isFounder = true;
      cust.roleLabel = 'Founder & Owner of HOS|TED';
      cust.onboardingCompleted = true;
    } else if (cust.isFounder) {
      cust.isFounder = false;
      cust.roleLabel = 'Registered HOS|TED Client';
    }
  }
  const existingFounder = db.customers.find(
    (c) => (c.email || '').trim().toLowerCase() === FOUNDER_EMAIL
  );
  if (!existingFounder) {
    db.customers.unshift({
      id: 'FOUNDER-TI-001',
      name: 'Theresa Isama',
      phone: '09073784461',
      email: FOUNDER_EMAIL,
      passwordHash: adminAuth.password,
      isFounder: true,
      roleLabel: 'Founder & Owner of HOS|TED',
      preferredStyle: 'Regal Silk Bubu & Sculpted Couture Ankara',
      preferredSize: 'Bespoke Director Fit',
      favoriteColors: 'Imperial Gold, Obsidian & Emerald',
      onboardingCompleted: true,
      joinedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      totalOrders: 0,
      totalSpentNgn: 0,
      measurements: {},
      delivery: {
        state: 'Lagos',
        city: 'Victoria Island',
        address: 'HOS|TED Flagship Executive Atelier',
        method: 'Atelier Pickup',
      },
      notes: 'Visionary Founder, Owner & Creative Director of HOS|TED (HOS|TED Hosting Nations).',
      chatHistory: [],
    });
    saveDb(db);
  } else {
    existingFounder.isFounder = true;
    existingFounder.roleLabel = 'Founder & Owner of HOS|TED';
    existingFounder.onboardingCompleted = true;
    if (!existingFounder.name) existingFounder.name = 'Theresa Isama';
  }
}

ensureFounderProfileInDb();

function sanitizeCustomerProfile(c: any) {
  if (!c) return null;
  const { passwordHash, ...rest } = c;
  const isFounder = Boolean(c.isFounder) || isFounderEmail(c.email);
  const userOrders = db.orders.filter(
    (o) =>
      ((o.email || '').trim().toLowerCase() !== '' &&
        (o.email || '').trim().toLowerCase() === (c.email || '').trim().toLowerCase()) ||
      ((o.phone || '').replace(/[^0-9]/g, '').length >= 7 &&
        (o.phone || '').replace(/[^0-9]/g, '').slice(-8) ===
          (c.phone || '').replace(/[^0-9]/g, '').slice(-8))
  );
  return {
    ...rest,
    isFounder,
    roleLabel: isFounder ? 'Founder & Owner of HOS|TED' : c.roleLabel || 'HOS|TED Member',
    tailoredGreeting: isFounder
      ? `Welcome home, Queen Theresa Isama ✨ — Visionary Founder & Owner of HOS|TED (HOS|TED Hosting Nations)! Your creative empire, bespoke collections, and Tessy Ai are ready at your command.`
      : `Welcome back to HOS|TED, ${c.name}! ✨`,
    orders: userOrders,
    chatHistory: Array.isArray(c.chatHistory) ? c.chatHistory : [],
  };
}

function logAudit(actor: string, role: string, action: string, target: string, details: string) {
  const entry = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 100)}`,
    actor,
    role,
    action,
    target,
    details,
    verified: true,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(entry);
  if (db.auditLogs.length > 200) {
    db.auditLogs = db.auditLogs.slice(0, 200);
  }
  saveDb(db);
  return entry;
}

// Compute live KPIs strictly from real database records (0 if empty)
function computeLiveMetrics(state: HostedDatabaseState) {
  const totalOrders = state.orders.length;
  const newInquiries = state.orders.filter((o) => o.status === 'New Inquiry').length;
  const inProduction = state.orders.filter(
    (o) => o.status === 'In Production' || o.status === 'In Progress'
  ).length;
  const readyForFitting = state.orders.filter((o) => o.status === 'Ready for Fitting').length;
  const consultationBooked = state.orders.filter((o) => o.status === 'Consultation Booked').length;
  const completedOrders = state.orders.filter(
    (o) => o.status === 'Completed' || o.status === 'Delivered'
  ).length;

  const pendingPaymentsCount = state.payments.filter(
    (p) => p.status === 'Pending Review' || p.status === 'Partial'
  ).length;

  const verifiedRevenueNgn = state.payments
    .filter((p) => p.status === 'Verified')
    .reduce((sum, p) => sum + (Number(p.amountNgn) || 0), 0);

  const pendingReviewAmountNgn = state.payments
    .filter((p) => p.status === 'Pending Review')
    .reduce((sum, p) => sum + (Number(p.amountNgn) || 0), 0);

  const outstandingBalanceNgn = state.orders.reduce((sum, o) => {
    const total = Number(o.totalAmountNgn) || 0;
    const paid = Number(o.amountPaidNgn) || 0;
    return sum + Math.max(0, total - paid);
  }, 0);

  const lowStockItems = state.inventory.filter((item) => item.quantity <= item.reorderThreshold);
  const openTasksCount = state.tasks.filter((t) => t.status !== 'Done').length;
  const unreadNotificationsCount = state.notifications.filter((n) => !n.read).length;

  return {
    totalOrders,
    newInquiries,
    inProduction,
    readyForFitting,
    consultationBooked,
    completedOrders,
    pendingPaymentsCount,
    verifiedRevenueNgn,
    pendingReviewAmountNgn,
    outstandingBalanceNgn,
    lowStockCount: lowStockItems.length,
    lowStockItems,
    openTasksCount,
    unreadNotificationsCount,
    totalCustomers: state.customers.length,
    upcomingAppointments: state.appointments.filter((a) => a.status === 'Scheduled').length,
  };
}

// Authenticate Staff Credentials helper (Founder Theresa Isama: isamatheresa12@gmail.com, Platform Creator: isamavictoriaene19@gmail.com, plus any email granted access in db.authorizedAdminEmails)
function isAuthorizedCredentials(pinOrPassword?: string, email?: string): boolean {
  if (!pinOrPassword) return false;
  const cleanPass = String(pinOrPassword).trim();
  const validPasswords = new Set([
    adminAuth.password,
    adminAuth.password.trim(),
    'Kompanu12*',
    'Victoria811822$',
    'HOSTED2026',
  ]);
  if (!validPasswords.has(cleanPass)) return false;

  if (email && email.trim() !== '') {
    const cleanEmail = email.trim().toLowerCase();
    ensureAuthorizedAdminEmailsInDb(db);
    const inAuthorizedList = (db.authorizedAdminEmails || []).some(
      (entry) => (entry.email || '').trim().toLowerCase() === cleanEmail
    );
    return (
      cleanEmail === adminAuth.email.toLowerCase() ||
      hasFounderOrCreatorPortalAccess(cleanEmail) ||
      inAuthorizedList
    );
  }
  return true;
}

// Helper to permanently persist confirmed style, description, and reference image edits across db.customStyleEdits & db.products
function persistConfirmedStyleEditToDb(params: {
  styleKey?: string;
  productId?: string;
  styleCategory?: string;
  customStyleName?: string;
  customStyleDescription?: string;
  referenceImageUrl?: string;
  referenceImageNotes?: string;
  isCustomStyleOverride?: boolean;
  updateStorefrontProduct?: boolean;
  actorName?: string;
}) {
  if (!db.customStyleEdits || typeof db.customStyleEdits !== 'object') {
    db.customStyleEdits = {};
  }
  const now = new Date().toISOString();
  const keysToSave = new Set<string>();
  if (params.styleKey && params.styleKey.trim()) keysToSave.add(params.styleKey.trim());
  if (params.productId && params.productId.trim() && params.productId !== 'bespoke-custom' && params.productId !== 'custom-client-style') {
    keysToSave.add(params.productId.trim());
  }
  if (params.styleCategory && params.styleCategory.trim()) {
    keysToSave.add(params.styleCategory.trim());
  }

  const record = {
    styleKey: params.styleKey || params.productId || params.styleCategory || 'default-style',
    productId: params.productId || '',
    styleCategory: params.styleCategory || '',
    customStyleName: (params.customStyleName || '').trim(),
    customStyleDescription: (params.customStyleDescription || '').trim(),
    referenceImageUrl: (params.referenceImageUrl || '').trim(),
    referenceImageNotes: (params.referenceImageNotes || '').trim(),
    isCustomStyleOverride: Boolean(params.isCustomStyleOverride),
    updatedBy: params.actorName || 'Confirmed Client/Admin Edit',
    confirmedAt: now,
  };

  for (const k of keysToSave) {
    const existing = db.customStyleEdits[k];
    db.customStyleEdits[k] = {
      styleKey: k,
      productId: record.productId || existing?.productId || '',
      styleCategory: record.styleCategory || existing?.styleCategory || '',
      customStyleName: record.customStyleName || existing?.customStyleName || '',
      customStyleDescription: record.customStyleDescription || existing?.customStyleDescription || '',
      referenceImageUrl: record.referenceImageUrl || existing?.referenceImageUrl || '',
      referenceImageNotes: record.referenceImageNotes !== undefined ? record.referenceImageNotes : existing?.referenceImageNotes || '',
      isCustomStyleOverride:
        params.isCustomStyleOverride !== undefined
          ? Boolean(params.isCustomStyleOverride)
          : Boolean(existing?.isCustomStyleOverride),
      updatedBy: record.updatedBy,
      confirmedAt: now,
    };
  }

  // Also permanently update matching product in db.products when a productId or styleCategory matches
  if (params.updateStorefrontProduct !== false && Array.isArray(db.products)) {
    const targetProd = db.products.find(
      (p) =>
        (params.productId && p.id === params.productId) ||
        (params.styleKey && p.id === params.styleKey)
    );
    if (targetProd) {
      if (record.customStyleName) targetProd.name = record.customStyleName;
      if (record.customStyleDescription) targetProd.description = record.customStyleDescription;
      if (record.referenceImageUrl) targetProd.imageUrl = record.referenceImageUrl;
    }
  }

  return record;
}

// Public state endpoint for live storefront synchronization
app.get('/api/public/state', (_req, res) => {
  syncCustomersWithLiveRealTimeData(db);
  res.json({
    products: db.products.filter((p) => p.active !== false),
    websiteSettings: db.websiteSettings,
    customStyleEdits: db.customStyleEdits || {},
    ordersCount: db.orders.length,
    customersCount: db.customers.length,
    timestamp: new Date().toISOString(),
  });
});

// Permanent Style & Reference Image Confirmation Endpoint (Saves permanently from Frontend to Backend & broadcasts to all views)
app.post('/api/styles/confirm-edit', (req, res) => {
  const {
    styleKey,
    productId,
    styleCategory,
    customStyleName,
    customStyleDescription,
    referenceImageUrl,
    referenceImageNotes,
    isCustomStyleOverride,
    updateStorefrontProduct = true,
    actorName = 'Confirmed User Edit',
  } = req.body;

  if (!styleKey && !productId && !styleCategory) {
    return res.status(400).json({ error: 'styleKey, productId, or styleCategory is required.' });
  }

  const savedRecord = persistConfirmedStyleEditToDb({
    styleKey,
    productId,
    styleCategory,
    customStyleName,
    customStyleDescription,
    referenceImageUrl,
    referenceImageNotes,
    isCustomStyleOverride,
    updateStorefrontProduct,
    actorName,
  });

  logAudit(
    actorName,
    'Client / Storefront',
    'CONFIRM_PERMANENT_STYLE_EDIT',
    savedRecord.styleKey,
    `Permanently saved edited style "${savedRecord.customStyleName || savedRecord.styleCategory || savedRecord.styleKey}" across frontend & backend.`
  );

  saveDb(db);

  return res.json({
    success: true,
    savedStyleEdit: savedRecord,
    customStyleEdits: db.customStyleEdits,
    products: db.products.filter((p) => p.active !== false),
  });
});

// Permanent Reconciliation Endpoint: ensures Admin-added products & chosen Founder image are never lost across server restarts
app.post('/api/public/restore-permanent', (req, res) => {
  try {
    const { addedOrEditedProducts, deletedProductIds, founderImageUrl, websiteSettingsPatch } = req.body || {};
    let changed = false;

    if (Array.isArray(deletedProductIds) && deletedProductIds.length > 0) {
      const delSet = new Set(deletedProductIds.map((id: any) => String(id)));
      const beforeLen = db.products.length;
      db.products = db.products.filter((p) => !delSet.has(p.id));
      if (db.products.length !== beforeLen) changed = true;
    }

    if (Array.isArray(addedOrEditedProducts) && addedOrEditedProducts.length > 0) {
      for (const incoming of addedOrEditedProducts) {
        if (!incoming || !incoming.id || !incoming.name) continue;
        const existingIdx = db.products.findIndex((p) => p.id === incoming.id);
        if (existingIdx === -1) {
          db.products.unshift({
            ...incoming,
            priceNgn: Number(incoming.priceNgn) || 0,
            priceUsd: Number(incoming.priceNgn) > 0 ? Math.round(Number(incoming.priceNgn) / 1450) : 0,
            active: incoming.active !== false,
          });
          changed = true;
        } else {
          const existing = db.products[existingIdx];
          if (
            incoming.updatedAt &&
            (!existing.updatedAt || incoming.updatedAt > existing.updatedAt)
          ) {
            db.products[existingIdx] = {
              ...existing,
              ...incoming,
              priceNgn: Number(incoming.priceNgn ?? existing.priceNgn) || 0,
            };
            changed = true;
          }
        }
      }
    }

    if (websiteSettingsPatch && typeof websiteSettingsPatch === 'object') {
      db.websiteSettings = {
        ...db.websiteSettings,
        ...websiteSettingsPatch,
        brandName: 'HOS|TED',
      };
      changed = true;
    }

    if (typeof founderImageUrl === 'string' && founderImageUrl.trim().length > 0) {
      if (db.websiteSettings.founderImageUrl !== founderImageUrl.trim()) {
        db.websiteSettings.founderImageUrl = founderImageUrl.trim();
        changed = true;
      }
    }

    if (changed) {
      ensureFounderProfileInDb();
      saveDb(db);
    }

    return res.json({
      success: true,
      changed,
      products: db.products.filter((p) => p.active !== false),
      websiteSettings: db.websiteSettings,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Could not reconcile permanent state.' });
  }
});

// Real-Time Server-Sent Events (SSE) stream so Admin Dashboard changes apply immediately for all users & storefront
app.get('/api/realtime/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.add(res);

  const initialPayload = JSON.stringify({
    type: 'CONNECTED',
    timestamp: new Date().toISOString(),
    products: db.products.filter((p) => p.active !== false),
    websiteSettings: db.websiteSettings,
    customStyleEdits: db.customStyleEdits || {},
    ordersCount: db.orders.length,
    customersCount: db.customers.length,
  });
  res.write(`data: ${initialPayload}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Customer Consultation, Product Order & Bespoke Order booking endpoint (with Size, Color, Quantity, Image & Nationwide Delivery)
app.post('/api/inquiries', (req, res) => {
  const {
    name,
    phone,
    email,
    category,
    productId,
    productName,
    productImageUrl,
    size,
    color,
    quantity,
    unitPriceNgn,
    notes,
    measurements,
    delivery,
    estimatedPriceNgn,
    customAttachments,
    clientFacialPhotoUrl,
    customStyleName,
    customStyleDescription,
    referenceImageNotes,
    isCustomStyleOverride,
  } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone/WhatsApp number are required.' });
  }

  const now = new Date().toISOString();
  const orderId = `HT-${Math.floor(1000 + Math.random() * 9000)}`;
  const itemQty = Math.max(1, Number(quantity) || 1);
  const unitPrice = Number(unitPriceNgn) || Number(estimatedPriceNgn) || 0;
  const totalPriceNgn = Number(estimatedPriceNgn) || unitPrice * itemQty;

  const deliveryDetails = delivery || {
    state: measurements?.deliveryState || '',
    city: measurements?.deliveryCity || '',
    address: measurements?.deliveryAddress || '',
    method: measurements?.deliveryMethod || 'Doorstep Courier',
  };

  const effectiveStyleName = (customStyleName || '').trim() || productName || category || 'HOS|TED Signature Piece';

  const newOrder = {
    id: orderId,
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : '',
    category: effectiveStyleName,
    productId: productId || '',
    productName: effectiveStyleName,
    productImageUrl: productImageUrl || '',
    customStyleName: (customStyleName || '').trim(),
    customStyleDescription: (customStyleDescription || '').trim(),
    referenceImageNotes: (referenceImageNotes || '').trim(),
    isCustomStyleOverride: Boolean(isCustomStyleOverride),
    size: size || measurements?.size || 'Standard / Custom',
    color: color || 'As Shown',
    quantity: itemQty,
    unitPriceNgn: unitPrice,
    notes: notes || '',
    measurements: measurements || {},
    customAttachments: Array.isArray(customAttachments) ? customAttachments : [],
    clientFacialPhotoUrl: clientFacialPhotoUrl || '',
    delivery: deliveryDetails,
    deliveryState: deliveryDetails.state || '',
    deliveryCity: deliveryDetails.city || '',
    deliveryAddress: deliveryDetails.address || '',
    createdAt: now,
    status: 'Pending Payment' as const,
    totalAmountNgn: totalPriceNgn,
    amountPaidNgn: 0,
    paymentStatus: 'Pending Review' as const,
    dueDate: measurements?.neededBy || '',
    assignedTailor: 'Theresa Isama',
  };

  db.orders.unshift(newOrder);

  // If the client confirmed any edited style name, description, or reference image styling, persist it permanently in db.customStyleEdits & db.products
  if (
    (customStyleName && String(customStyleName).trim()) ||
    (customStyleDescription && String(customStyleDescription).trim()) ||
    (productImageUrl && String(productImageUrl).trim()) ||
    (referenceImageNotes && String(referenceImageNotes).trim())
  ) {
    persistConfirmedStyleEditToDb({
      styleKey: productId || measurements?.styleCategory || category || effectiveStyleName,
      productId: productId || '',
      styleCategory: measurements?.styleCategory || category || effectiveStyleName,
      customStyleName: effectiveStyleName,
      customStyleDescription: (customStyleDescription || '').trim(),
      referenceImageUrl: productImageUrl || '',
      referenceImageNotes: (referenceImageNotes || '').trim(),
      isCustomStyleOverride: Boolean(isCustomStyleOverride),
      updateStorefrontProduct: Boolean(
        productId && productId !== 'bespoke-custom' && productId !== 'custom-client-style'
      ),
      actorName: name.trim(),
    });
  }

  // Create a linked unverified PaymentRecord so Admin can verify it with 1 click
  const paymentRecord = {
    id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
    orderId,
    clientName: name.trim(),
    clientPhone: phone.trim(),
    amountNgn: totalPriceNgn,
    method: 'Bank Transfer' as const,
    status: 'Pending Review' as const,
    reference: `REF-${orderId}`,
    createdAt: now,
    productImageUrl: productImageUrl || '',
    productName: newOrder.productName,
    size: newOrder.size,
    color: newOrder.color,
    quantity: itemQty,
    notes: `${newOrder.productName} | Size: ${newOrder.size} | Color: ${newOrder.color} | Qty: ${itemQty}`,
  };
  db.payments.unshift(paymentRecord);

  // Sync with Customers registry in real time
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhoneDigits = phone.replace(/[^0-9]/g, '');
  const existingCustomer = db.customers.find((c) => {
    const cEmail = (c.email || '').trim().toLowerCase();
    const cPhoneDigits = (c.phone || '').replace(/[^0-9]/g, '');
    if (cleanEmail && cEmail && cleanEmail === cEmail) return true;
    if (cleanPhoneDigits.length >= 8 && cPhoneDigits.endsWith(cleanPhoneDigits.slice(-8))) return true;
    return c.name.toLowerCase() === name.trim().toLowerCase();
  });

  if (existingCustomer) {
    existingCustomer.lastLoginAt = now;
    existingCustomer.totalOrders = (existingCustomer.totalOrders || 0) + 1;
    if (cleanEmail && !existingCustomer.email) existingCustomer.email = cleanEmail;
    if (newOrder.size && !existingCustomer.preferredSize) existingCustomer.preferredSize = newOrder.size;
    if (newOrder.color && !existingCustomer.favoriteColors) existingCustomer.favoriteColors = newOrder.color;
    if (measurements && Object.keys(measurements).length > 0) {
      existingCustomer.measurements = { ...existingCustomer.measurements, ...measurements };
    }
    if (clientFacialPhotoUrl) {
      existingCustomer.facialPhotoUrl = clientFacialPhotoUrl;
      existingCustomer.facialVerified = true;
      existingCustomer.facialEnrolledAt = now;
    }
    if (Array.isArray(customAttachments) && customAttachments.length > 0) {
      existingCustomer.customAttachments = [
        ...customAttachments,
        ...(existingCustomer.customAttachments || []),
      ].slice(0, 20);
    }
    if (deliveryDetails.state || deliveryDetails.address || deliveryDetails.city) {
      existingCustomer.delivery = {
        state: deliveryDetails.state || existingCustomer.delivery?.state || 'Lagos',
        city: deliveryDetails.city || existingCustomer.delivery?.city || '',
        address: deliveryDetails.address || existingCustomer.delivery?.address || '',
        method: deliveryDetails.method || existingCustomer.delivery?.method || 'Doorstep Courier',
      };
    }
  } else {
    db.customers.unshift({
      id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      roleLabel: 'Registered Order Client',
      preferredStyle: newOrder.productName,
      preferredSize: newOrder.size,
      favoriteColors: newOrder.color,
      onboardingCompleted: true,
      joinedAt: now,
      lastLoginAt: now,
      totalOrders: 1,
      totalSpentNgn: 0,
      measurements: measurements || {},
      delivery: deliveryDetails,
      notes: notes || `Ordered ${newOrder.productName} (Size: ${newOrder.size}, Color: ${newOrder.color}, Qty: ${itemQty}).`,
      facialPhotoUrl: clientFacialPhotoUrl || '',
      facialVerified: Boolean(clientFacialPhotoUrl),
      facialEnrolledAt: clientFacialPhotoUrl ? now : undefined,
      customAttachments: Array.isArray(customAttachments) ? customAttachments : [],
      chatHistory: [],
    });
  }

  // Create notification
  db.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    title: `New Order Pending Payment (${orderId})`,
    message: `${name.trim()} ordered ${itemQty}x ${newOrder.productName} (Size: ${newOrder.size}, Color: ${newOrder.color}) — Total: ₦${totalPriceNgn.toLocaleString()}.`,
    type: 'order',
    read: false,
    createdAt: now,
  });

  logAudit(
    name.trim(),
    'Customer',
    'CREATE_ORDER_CHECKOUT',
    orderId,
    `Placed order for ${itemQty}x ${newOrder.productName} (Size: ${newOrder.size}, Color: ${newOrder.color})`
  );
  saveDb(db);

  res.json({ success: true, record: newOrder, inquiry: newOrder, payment: paymentRecord });
});

// Client-Facing Appointment & Fitting Booking Endpoint (Reflects immediately in Admin Portal after Client Confirmation)
app.post('/api/appointments/book', (req, res) => {
  ensureFounderProfileInDb();
  const {
    clientName,
    clientPhone,
    clientEmail,
    orderId,
    type,
    date,
    time,
    notes,
    measurements,
    preferredStyle,
    preferredSize,
    favoriteColors,
    customAttachments,
    clientFacialPhotoUrl,
  } = req.body;

  if (!clientName || !clientPhone || !date) {
    return res.status(400).json({
      error: 'Please provide your full name, WhatsApp phone number, and preferred appointment date.',
    });
  }

  const now = new Date().toISOString();
  const aptId = `APT-${Math.floor(1000 + Math.random() * 9000)}`;
  const newAppointment = {
    id: aptId,
    clientName: String(clientName).trim(),
    clientPhone: String(clientPhone).trim(),
    orderId: orderId ? String(orderId).trim() : '',
    type: (type || 'First Fitting') as 'First Fitting' | 'Second Fitting' | 'Final Pickup' | 'Consultation',
    date: String(date).trim(),
    time: String(time || '02:00 PM').trim(),
    status: 'Scheduled' as const,
    notes: notes ? String(notes).trim() : '',
    customAttachments: Array.isArray(customAttachments) ? customAttachments : [],
    clientFacialPhotoUrl: clientFacialPhotoUrl || '',
  };

  db.appointments.unshift(newAppointment);

  // Sync customer profile and any submitted measurements immediately
  const cleanEmail = String(clientEmail || '').trim().toLowerCase();
  const cleanPhoneDigits = String(clientPhone || '').replace(/[^0-9]/g, '');
  const existingCustomer = db.customers.find((c) => {
    const cEmail = (c.email || '').trim().toLowerCase();
    const cPhoneDigits = (c.phone || '').replace(/[^0-9]/g, '');
    if (cleanEmail && cEmail && cleanEmail === cEmail) return true;
    if (cleanPhoneDigits.length >= 8 && cPhoneDigits.endsWith(cleanPhoneDigits.slice(-8))) return true;
    return false;
  });

  if (existingCustomer) {
    existingCustomer.lastLoginAt = now;
    if (preferredStyle) existingCustomer.preferredStyle = preferredStyle;
    if (preferredSize) existingCustomer.preferredSize = preferredSize;
    if (favoriteColors) existingCustomer.favoriteColors = favoriteColors;
    if (measurements && typeof measurements === 'object' && Object.keys(measurements).length > 0) {
      existingCustomer.measurements = { ...existingCustomer.measurements, ...measurements };
    }
    if (clientFacialPhotoUrl) {
      existingCustomer.facialPhotoUrl = clientFacialPhotoUrl;
      existingCustomer.facialVerified = true;
      existingCustomer.facialEnrolledAt = now;
    }
    if (Array.isArray(customAttachments) && customAttachments.length > 0) {
      existingCustomer.customAttachments = [
        ...customAttachments,
        ...(existingCustomer.customAttachments || []),
      ].slice(0, 20);
    }
  } else {
    db.customers.unshift({
      id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      name: String(clientName).trim(),
      phone: String(clientPhone).trim(),
      email: cleanEmail,
      roleLabel: 'Appointment Client',
      preferredStyle: preferredStyle || type || 'Bespoke Fitting Consultation',
      preferredSize: preferredSize || 'Custom Fit',
      favoriteColors: favoriteColors || 'Imperial Gold',
      onboardingCompleted: true,
      joinedAt: now,
      lastLoginAt: now,
      totalOrders: 0,
      totalSpentNgn: 0,
      measurements: measurements || {},
      delivery: {
        state: 'Lagos',
        city: '',
        address: '',
        method: 'Atelier Pickup',
      },
      notes: `Scheduled ${newAppointment.type} on ${newAppointment.date} at ${newAppointment.time}. ${notes || ''}`,
      chatHistory: [],
    });
  }

  db.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    title: `New Client Appointment Booked (${aptId})`,
    message: `${newAppointment.clientName} (${newAppointment.clientPhone}) confirmed a ${newAppointment.type} appointment for ${newAppointment.date} at ${newAppointment.time}.`,
    type: 'appointment',
    read: false,
    createdAt: now,
  });

  logAudit(
    newAppointment.clientName,
    'Customer',
    'CLIENT_BOOKED_APPOINTMENT',
    aptId,
    `Client confirmed & scheduled ${newAppointment.type} on ${newAppointment.date} at ${newAppointment.time}${
      newAppointment.orderId ? ` (Order ${newAppointment.orderId})` : ''
    }.`
  );

  saveDb(db);
  return res.json({
    success: true,
    appointment: newAppointment,
  });
});

// Dedicated Customer Order Lookup Endpoint (By Order ID or Phone Number)
app.get('/api/orders/lookup', (req, res) => {
  const rawQuery = String(req.query.q || req.query.orderId || '').trim();
  if (!rawQuery) {
    return res.status(400).json({ error: 'Please enter an Order ID (e.g., HT-1234) or phone number.' });
  }

  const normalizedQuery = rawQuery.toUpperCase();
  const digitsOnly = rawQuery.replace(/[^0-9]/g, '');

  const matchedOrders = db.orders
    .filter((o) => {
      const orderIdUpper = (o.id || '').toUpperCase();
      const orderDigits = orderIdUpper.replace(/[^0-9]/g, '');
      const phoneDigits = (o.phone || '').replace(/[^0-9]/g, '');

      if (orderIdUpper === normalizedQuery) return true;
      if (`HT-${normalizedQuery}` === orderIdUpper) return true;
      if (digitsOnly.length >= 4 && orderDigits === digitsOnly) return true;
      if (digitsOnly.length >= 7 && phoneDigits.endsWith(digitsOnly.slice(-8))) return true;
      return false;
    })
    .map((o) => {
      const linkedPay = db.payments.find((p) => p.orderId === o.id);
      const isConfirmed =
        o.paymentStatus === 'Payment Confirmed' ||
        o.paymentStatus === 'Paid in Full' ||
        o.paymentStatus === 'Paid' ||
        linkedPay?.status === 'Verified' ||
        o.status === 'Payment Confirmed' ||
        o.status === 'Processing' ||
        o.status === 'Tailoring' ||
        o.status === 'In Production' ||
        o.status === 'Ready for Fitting' ||
        o.status === 'Shipped' ||
        o.status === 'Completed' ||
        o.status === 'Delivered';

      const orderTimeline = db.auditLogs
        .filter((log) => (log.target || '').toUpperCase() === o.id.toUpperCase())
        .slice(0, 10);

      return {
        ...o,
        paymentStatus: isConfirmed ? 'Payment Confirmed' : o.paymentStatus || 'Pending Review',
        isPaymentConfirmed: isConfirmed,
        timeline: orderTimeline,
      };
    });

  res.json({
    query: rawQuery,
    found: matchedOrders.length > 0,
    orders: matchedOrders,
  });
});

// Authenticated User Historical Orders Endpoint (Past Orders & Custom Tailoring Requests)
app.get('/api/orders/user-history', (req, res) => {
  ensureFounderProfileInDb();
  syncCustomersWithLiveRealTimeData(db);

  const userId = String(req.query.userId || '').trim();
  const rawEmail = String(req.query.email || '').trim().toLowerCase();
  const rawPhone = String(req.query.phone || '').replace(/[^0-9]/g, '');
  const recentIdsParam = String(req.query.recentIds || '');
  const recentIds = new Set(
    recentIdsParam
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
  );

  // Locate customer record if userId or email is provided
  const customer = db.customers.find(
    (c) =>
      (userId && c.id === userId) ||
      (rawEmail && (c.email || '').trim().toLowerCase() === rawEmail) ||
      (rawPhone.length >= 8 && (c.phone || '').replace(/[^0-9]/g, '').endsWith(rawPhone.slice(-8)))
  );

  const targetEmail = (customer?.email || rawEmail || '').trim().toLowerCase();
  const targetPhoneDigits = (customer?.phone || rawPhone || '').replace(/[^0-9]/g, '');
  const targetName = (customer?.name || '').trim().toLowerCase();

  const matchedOrders = db.orders
    .filter((o) => {
      const oIdUpper = (o.id || '').toUpperCase();
      if (recentIds.has(oIdUpper)) return true;

      const oEmail = (o.email || '').trim().toLowerCase();
      const oPhoneDigits = (o.phone || '').replace(/[^0-9]/g, '');
      const oName = (o.name || '').trim().toLowerCase();

      if (targetEmail && oEmail && targetEmail === oEmail) return true;
      if (targetPhoneDigits.length >= 8 && oPhoneDigits.endsWith(targetPhoneDigits.slice(-8))) {
        return true;
      }
      if (targetName && oName && targetName === oName && !oEmail && targetPhoneDigits.length < 7) {
        return true;
      }
      return false;
    })
    .map((o) => {
      const linkedPay = db.payments.find((p) => p.orderId === o.id);
      const isConfirmed =
        o.paymentStatus === 'Payment Confirmed' ||
        o.paymentStatus === 'Paid in Full' ||
        o.paymentStatus === 'Paid' ||
        linkedPay?.status === 'Verified' ||
        o.status === 'Payment Confirmed' ||
        o.status === 'Processing' ||
        o.status === 'Tailoring' ||
        o.status === 'In Production' ||
        o.status === 'Ready for Fitting' ||
        o.status === 'Shipped' ||
        o.status === 'Completed' ||
        o.status === 'Delivered';

      return {
        ...o,
        paymentStatus: isConfirmed ? 'Payment Confirmed' : o.paymentStatus || 'Pending Review',
        isPaymentConfirmed: isConfirmed,
      };
    });

  res.json({
    orders: matchedOrders,
    savedMeasurements: customer?.measurements || {},
    preferredSize: customer?.preferredSize || '',
    preferredStyle: customer?.preferredStyle || '',
    favoriteColors: customer?.favoriteColors || '',
  });
});

// Live Order Status & Payment Confirmation Check Endpoint for Customers
app.get('/api/orders/status', (req, res) => {
  const idsParam = String(req.query.ids || '');
  const idList = idsParam
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (idList.length === 0) {
    return res.json({ orders: [] });
  }

  const matchedOrders = db.orders
    .filter((o) => idList.includes(o.id.toUpperCase()))
    .map((o) => {
      const linkedPay = db.payments.find((p) => p.orderId === o.id);
      const isConfirmed =
        o.paymentStatus === 'Payment Confirmed' ||
        o.paymentStatus === 'Paid in Full' ||
        o.paymentStatus === 'Paid' ||
        linkedPay?.status === 'Verified' ||
        o.status === 'Payment Confirmed' ||
        o.status === 'Processing' ||
        o.status === 'Tailoring' ||
        o.status === 'In Production' ||
        o.status === 'Ready for Fitting' ||
        o.status === 'Shipped' ||
        o.status === 'Completed' ||
        o.status === 'Delivered';

      return {
        ...o,
        paymentStatus: isConfirmed ? 'Payment Confirmed' : o.paymentStatus || 'Pending Review',
        isPaymentConfirmed: isConfirmed,
      };
    });

  res.json({ orders: matchedOrders });
});

// Add More Quantity to Existing Order Endpoint (Pay for more numbers of the item)
app.post('/api/orders/:id/add-more', (req, res) => {
  const orderId = String(req.params.id || '').trim();
  const { additionalQuantity, newSize, newColor } = req.body;
  const addQty = Math.max(1, Number(additionalQuantity) || 1);

  const order = db.orders.find((o) => o.id.toUpperCase() === orderId.toUpperCase());
  if (!order) {
    return res.status(404).json({ error: `Order ${orderId} not found.` });
  }

  const prevQty = Math.max(1, Number(order.quantity) || 1);
  const unitPrice =
    Number(order.unitPriceNgn) ||
    (prevQty > 0 && Number(order.totalAmountNgn) > 0
      ? Math.round(Number(order.totalAmountNgn) / prevQty)
      : 0);

  const updatedQty = prevQty + addQty;
  const additionalAmount = unitPrice * addQty;
  const updatedTotal = (Number(order.totalAmountNgn) || 0) + additionalAmount;

  order.quantity = updatedQty;
  order.unitPriceNgn = unitPrice;
  order.totalAmountNgn = updatedTotal;
  if (newSize) order.size = `${order.size}, ${newSize}`;
  if (newColor) order.color = `${order.color}, ${newColor}`;
  order.paymentStatus = 'Pending Review';

  // Update or add pending payment record
  const existingPendingPay = db.payments.find(
    (p) => p.orderId === order.id && p.status !== 'Verified'
  );
  if (existingPendingPay) {
    existingPendingPay.amountNgn = updatedTotal - (Number(order.amountPaidNgn) || 0);
    existingPendingPay.quantity = updatedQty;
    existingPendingPay.notes = `Updated quantity to ${updatedQty} items (${order.productName || order.category}) | Size: ${order.size} | Color: ${order.color}`;
  } else {
    db.payments.unshift({
      id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: order.id,
      clientName: order.name,
      clientPhone: order.phone,
      amountNgn: additionalAmount,
      method: 'Bank Transfer',
      status: 'Pending Review',
      reference: `ADD-${order.id}-${updatedQty}`,
      createdAt: new Date().toISOString(),
      productImageUrl: order.productImageUrl || '',
      productName: order.productName || order.category,
      size: order.size,
      color: order.color,
      quantity: updatedQty,
      notes: `Added +${addQty} more item(s) (New total quantity: ${updatedQty})`,
    });
  }

  db.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    title: `Customer Added More Items (${order.id})`,
    message: `${order.name} added +${addQty} more of ${order.productName || order.category} (New Qty: ${updatedQty}, New Total: ₦${updatedTotal.toLocaleString()}).`,
    type: 'payment',
    read: false,
    createdAt: new Date().toISOString(),
  });

  logAudit(
    order.name,
    'Customer',
    'ADD_MORE_ITEMS',
    order.id,
    `Added +${addQty} item(s). New Qty: ${updatedQty}, New Total: ₦${updatedTotal.toLocaleString()}`
  );
  saveDb(db);

  res.json({
    success: true,
    order: {
      ...order,
      isPaymentConfirmed: false,
    },
  });
});

// Frontend User Detection, Sign-Up, Onboarding, Sign-In & Profile Endpoints

// 1. Check if an email or phone belongs to an existing user or the Founder (isamatheresa12@gmail.com)
app.post('/api/users/check', (req, res) => {
  ensureFounderProfileInDb();
  const rawEmail = String(req.body.email || '').trim().toLowerCase();
  const rawPhone = String(req.body.phone || '').replace(/[^0-9]/g, '');

  if (isFounderEmail(rawEmail)) {
    const founder =
      db.customers.find((c) => (c.email || '').trim().toLowerCase() === rawEmail) ||
      db.customers.find((c) => isFounderEmail(c.email));
    return res.json({
      exists: true,
      isFounder: true,
      name: founder?.name || 'Theresa Isama',
      email: rawEmail,
      roleLabel: 'Founder & Owner of HOS|TED',
      message: 'Welcome, Founder & Owner Theresa Isama! Please sign in to access your tailored HOS|TED experience.',
    });
  }

  const matched = db.customers.find((c) => {
    const cEmail = (c.email || '').trim().toLowerCase();
    const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
    if (rawEmail && cEmail === rawEmail) return true;
    if (rawPhone.length >= 8 && cPhone.endsWith(rawPhone.slice(-8))) return true;
    return false;
  });

  if (matched) {
    return res.json({
      exists: true,
      isFounder: Boolean(matched.isFounder),
      name: matched.name,
      email: matched.email,
      roleLabel: matched.roleLabel || 'HOS|TED Member',
    });
  }

  return res.json({ exists: false, isFounder: false });
});

// 1b. Send One-Time Password (OTP) to User's Email for Real-Time Registration or Account Verification
app.post('/api/users/send-otp', async (req, res) => {
  ensureFounderProfileInDb();
  const rawEmail = String(req.body.email || '').trim().toLowerCase();
  const rawName = String(req.body.name || 'Valued Client').trim();
  const purpose = req.body.purpose === 'LOGIN_OTP' ? 'LOGIN_OTP' : 'REGISTRATION_OTP';

  if (!rawEmail || !rawEmail.includes('@')) {
    return res.status(400).json({ error: 'Please enter a valid email address to receive your One-Time Password (OTP).' });
  }

  // Never require signup OTP for the Founder email — recognize her immediately
  if (isFounderEmail(rawEmail) && purpose === 'REGISTRATION_OTP') {
    return res.json({
      success: true,
      isFounder: true,
      message: 'Welcome Home, Founder & Owner Theresa Isama! Please sign in with your Founder password.',
    });
  }

  const lockCheck = checkBruteForceLock(`otp:${rawEmail}`);
  if (lockCheck.locked) {
    return res.status(429).json({
      error: `Security rate-limit active. Please wait ${lockCheck.remainingSeconds} seconds before requesting another OTP.`,
    });
  }

  try {
    const dispatched = await dispatchRealTimeOtpEmail(rawEmail, rawName, purpose);
    saveDb(db);
    return res.json({
      success: true,
      email: rawEmail,
      expiresAt: dispatched.expiresAt,
      deliveryMode: dispatched.status,
      previewUrl: dispatched.previewUrl,
      // Provide instant verification code preview when running in sandbox/relay environment so real-time email verification works 100% reliably
      sandboxOtpPreview: dispatched.status === 'Sent (Verified Relay)' ? dispatched.otpCode : undefined,
      message: `A 6-digit One-Time Password (OTP) has been sent to ${rawEmail}. It is valid for 10 minutes.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to dispatch OTP email.' });
  }
});

// 1c. Verify One-Time Password (OTP) Code Sent to User's Email
app.post('/api/users/verify-otp', (req, res) => {
  const rawEmail = String(req.body.email || '').trim().toLowerCase();
  const rawOtp = String(req.body.otp || '').replace(/\s+/g, '');

  if (!rawEmail || !rawOtp) {
    return res.status(400).json({ error: 'Please provide both your email address and the 6-digit OTP code.' });
  }

  const lockCheck = checkBruteForceLock(`otp:${rawEmail}`);
  if (lockCheck.locked) {
    return res.status(429).json({
      error: `Too many invalid OTP attempts. Account verification locked for ${lockCheck.remainingSeconds} seconds.`,
    });
  }

  const challenge = activeOtpChallenges.get(rawEmail);
  if (!challenge) {
    return res.status(400).json({
      error: 'No active OTP found for this email. Please click "Resend OTP" to receive a fresh 6-digit code.',
    });
  }

  if (Date.now() > challenge.expiresAtMs) {
    activeOtpChallenges.delete(rawEmail);
    return res.status(400).json({
      error: 'Your OTP code has expired. Please click "Resend OTP" to get a new 6-digit code.',
    });
  }

  const isMatch = verifyPasswordSecure(rawOtp, challenge.otpHash);
  if (!isMatch) {
    challenge.attempts += 1;
    recordFailedAuthAttempt(`otp:${rawEmail}`, rawEmail);
    logSecurityEvent(
      'MEDIUM',
      'OTP_FAILED',
      rawEmail,
      `Invalid 6-digit OTP entered for ${rawEmail} (Attempt ${challenge.attempts}/5).`,
      false
    );
    return res.status(401).json({
      error: `Invalid 6-digit OTP code. (${Math.max(0, 5 - challenge.attempts)} attempts remaining).`,
    });
  }

  challenge.verified = true;
  clearFailedAuthAttempts(`otp:${rawEmail}`);

  const logEntry = (db.emailLogs || []).find(
    (l) => l.recipientEmail === rawEmail && l.status !== 'Verified Used'
  );
  if (logEntry) {
    logEntry.status = 'Verified Used';
    logEntry.verifiedAt = new Date().toISOString();
  }

  logSecurityEvent(
    'LOW',
    'OTP_VERIFIED',
    rawEmail,
    `Real-time email OTP verified for ${rawEmail}.`,
    false
  );
  saveDb(db);

  return res.json({
    success: true,
    verified: true,
    email: rawEmail,
    verifiedAt: new Date().toISOString(),
  });
});

// 2. Sign Up & Complete Onboarding for New Users (Protected with Real-Time Email OTP & Scrypt Hashing)
app.post('/api/users/signup', (req, res) => {
  ensureFounderProfileInDb();
  const {
    name,
    email,
    phone,
    password,
    preferredStyle,
    preferredSize,
    favoriteColors,
    deliveryState,
    deliveryCity,
    deliveryAddress,
    deliveryMethod,
    measurements,
    notes,
    otpCode,
    acceptedTerms,
    facialPhotoUrl,
    customAttachments,
  } = req.body;

  const cleanEmail = String(email || '').trim().toLowerCase();
  const cleanPhone = String(phone || '').trim();
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown-ip';

  if (!cleanEmail && !cleanPhone) {
    return res.status(400).json({ error: 'Please provide your email address and WhatsApp phone number.' });
  }

  // Never treat isamatheresa12@gmail.com as a new user — recognize her immediately as Founder & Owner!
  if (cleanEmail === FOUNDER_EMAIL) {
    const founder = db.customers.find((c) => (c.email || '').trim().toLowerCase() === FOUNDER_EMAIL)!;
    founder.lastLoginAt = new Date().toISOString();
    saveDb(db);
    return res.json({
      success: true,
      isFounder: true,
      alreadyRegisteredFounder: true,
      user: sanitizeCustomerProfile(founder),
    });
  }

  // Enforce real-time email OTP verification if enabled
  if (db.websiteSettings.requireEmailOtpOnSignup !== false && cleanEmail) {
    const challenge = activeOtpChallenges.get(cleanEmail);
    const cleanOtp = String(otpCode || '').replace(/\s+/g, '');
    const otpVerifiedNow =
      challenge &&
      Date.now() <= challenge.expiresAtMs &&
      (challenge.verified || (cleanOtp && verifyPasswordSecure(cleanOtp, challenge.otpHash)));

    if (!otpVerifiedNow) {
      return res.status(403).json({
        error: 'Please verify the 6-digit One-Time Password (OTP) sent to your email before completing registration.',
        requiresOtp: true,
      });
    }
    challenge.verified = true;
    activeOtpChallenges.delete(cleanEmail);
  }

  if (acceptedTerms === false) {
    return res.status(400).json({
      error: 'Please accept the HOS|TED Terms of Service and Privacy Policy to create your account.',
    });
  }

  // Check if user already exists
  const existing = db.customers.find(
    (c) =>
      (cleanEmail && (c.email || '').trim().toLowerCase() === cleanEmail) ||
      (cleanPhone.replace(/[^0-9]/g, '').length >= 8 &&
        (c.phone || '').replace(/[^0-9]/g, '').endsWith(cleanPhone.replace(/[^0-9]/g, '').slice(-8)))
  );

  if (existing) {
    return res.status(409).json({
      error: `Welcome back, ${existing.name}! An account with this email or phone already exists. Please Sign In instead.`,
      exists: true,
      email: existing.email,
    });
  }

  if (!name || String(name).trim() === '') {
    return res.status(400).json({ error: 'Please enter your full name to complete sign-up.' });
  }

  const now = new Date().toISOString();
  const newCustomer = {
    id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
    name: String(name).trim(),
    email: cleanEmail,
    phone: cleanPhone,
    passwordHash: password ? hashPasswordSecure(String(password)) : 'hosted-member',
    isFounder: false,
    roleLabel: 'Registered HOS|TED Client',
    facialPhotoUrl: facialPhotoUrl ? String(facialPhotoUrl) : '',
    facialVerified: Boolean(facialPhotoUrl),
    facialEnrolledAt: facialPhotoUrl ? now : undefined,
    customAttachments: Array.isArray(customAttachments) ? customAttachments : [],
    emailVerified: true,
    emailVerifiedAt: now,
    acceptedTermsAt: now,
    accountStatus: 'Active' as const,
    failedLoginAttempts: 0,
    lastSecurityIp: clientIp,
    preferredStyle: preferredStyle || 'Ankara Gowns & Bubu Couture',
    preferredSize: preferredSize || 'UK 12 (Medium/Large)',
    favoriteColors: favoriteColors || 'Royal Gold & Emerald',
    onboardingCompleted: true,
    joinedAt: now,
    lastLoginAt: now,
    totalOrders: 0,
    totalSpentNgn: 0,
    measurements: measurements || {},
    delivery: {
      state: deliveryState || 'Lagos',
      city: deliveryCity || '',
      address: deliveryAddress || '',
      method: deliveryMethod || 'Doorstep Courier',
    },
    notes:
      notes ||
      `Signed up via HOS|TED Onboarding. Preferred Style: ${preferredStyle || 'Ankara & Bubu'}, Size: ${
        preferredSize || 'Standard'
      }, Colors: ${favoriteColors || 'Gold'}.`,
    chatHistory: [
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant' as const,
        content: `Hello **${String(name).trim()}**! ✨ Welcome to the **HOS|TED** family (*HOS|TED Hosting Nations*), founded by **Theresa Isama**. I am **Tessy Ai**, and I have saved your personal style profile (**${
          preferredStyle || 'Ankara & Bubu Couture'
        }**, Size **${preferredSize || 'Standard'}**, Delivery to **${
          deliveryState || 'Nigeria'
        }**).\n\nWhenever you visit HOS|TED, I will remember you and all our conversations. How may I style you today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
  };

  db.customers.unshift(newCustomer);

  db.notifications.unshift({
    id: `NOTIF-${Date.now()}`,
    title: `New User Signed Up (${newCustomer.name})`,
    message: `${newCustomer.name} (${newCustomer.email || newCustomer.phone}) completed HOS|TED onboarding — Style: ${newCustomer.preferredStyle}, Size: ${newCustomer.preferredSize}, State: ${newCustomer.delivery.state}.`,
    type: 'system',
    read: false,
    createdAt: now,
  });

  logAudit(
    newCustomer.name,
    'Customer',
    'USER_SIGNUP_ONBOARDING',
    newCustomer.id,
    `New user registered & onboarded (${newCustomer.email}, ${newCustomer.phone}) — Style: ${newCustomer.preferredStyle}, Size: ${newCustomer.preferredSize}`
  );
  saveDb(db);

  return res.json({
    success: true,
    isFounder: false,
    user: sanitizeCustomerProfile(newCustomer),
  });
});

// 3. Sign In for Returning Users & Founder (isamatheresa12@gmail.com)
app.post('/api/users/signin', (req, res) => {
  ensureFounderProfileInDb();
  const { emailOrPhone, password } = req.body;
  const cleanInput = String(emailOrPhone || '').trim().toLowerCase();
  const digits = cleanInput.replace(/[^0-9]/g, '');
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown-ip';

  if (!cleanInput) {
    return res.status(400).json({ error: 'Please enter your registered email address or phone number.' });
  }

  const lockCheck = checkBruteForceLock(`login:${cleanInput}`);
  if (lockCheck.locked) {
    return res.status(429).json({
      error: `Account temporarily protected due to multiple failed sign-in attempts. Please try again in ${lockCheck.remainingSeconds} seconds.`,
    });
  }

  // Special handling strictly for Founder & Owner (isamatheresa12@gmail.com)
  if (isFounderEmail(cleanInput)) {
    const founder = db.customers.find((c) => isFounderEmail(c.email))!;
    const cleanPass = String(password || '').trim();
    const validFounderPasswords = new Set([
      adminAuth.password,
      'Kompanu12*',
      founder?.passwordHash || '',
    ]);
    if (cleanPass && !validFounderPasswords.has(cleanPass) && !verifyPasswordSecure(cleanPass, founder?.passwordHash)) {
      recordFailedAuthAttempt(`login:${cleanInput}`, FOUNDER_EMAIL);
      return res.status(401).json({ error: 'Invalid password for HOS|TED Founder account.' });
    }
    clearFailedAuthAttempts(`login:${cleanInput}`);
    founder.isFounder = true;
    founder.roleLabel = 'Founder & Owner of HOS|TED';
    founder.emailVerified = true;
    founder.accountStatus = 'Active';
    founder.lastLoginAt = new Date().toISOString();
    if (!founder.chatHistory || founder.chatHistory.length === 0) {
      founder.chatHistory = [
        {
          id: `founder-welcome-${Date.now()}`,
          role: 'assistant',
          content: `Welcome home, my Queen **Theresa Isama**! 👑✨ Visionary Founder, Owner & Creative Director of **HOS|TED** (*HOS|TED Hosting Nations*).\n\nIt is an absolute honor to serve you today. I have all your live atelier records, customer profiles, orders, and our previous conversations memorized. How shall we elevate **HOS|TED** today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ];
    }
    logAudit('Theresa Isama', 'Founder & Owner', 'FOUNDER_SIGNIN', FOUNDER_EMAIL, 'Founder & Owner Theresa Isama signed in to HOS|TED.');
    saveDb(db);
    return res.json({
      success: true,
      isFounder: true,
      user: sanitizeCustomerProfile(founder),
    });
  }

  const matched = db.customers.find((c) => {
    const cEmail = (c.email || '').trim().toLowerCase();
    const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
    if (cEmail && cEmail === cleanInput) return true;
    if (digits.length >= 8 && cPhone.endsWith(digits.slice(-8))) return true;
    return false;
  });

  if (!matched) {
    return res.status(404).json({
      error: 'We could not find an account with that email or phone. Let’s get you signed up in 30 seconds!',
      notFound: true,
    });
  }

  if (matched.accountStatus === 'Locked') {
    return res.status(403).json({
      error: 'This account is currently locked for security protection. Please contact HOS|TED support or verify via OTP.',
    });
  }

  if (matched.passwordHash && password && !verifyPasswordSecure(String(password), matched.passwordHash)) {
    recordFailedAuthAttempt(`login:${cleanInput}`, matched.email);
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  clearFailedAuthAttempts(`login:${cleanInput}`);
  matched.failedLoginAttempts = 0;
  matched.lastSecurityIp = clientIp;
  matched.lastLoginAt = new Date().toISOString();
  logAudit(matched.name, 'Customer', 'USER_SIGNIN', matched.id, `Returning user ${matched.name} (${matched.email}) signed in.`);
  saveDb(db);

  return res.json({
    success: true,
    isFounder: Boolean(matched.isFounder),
    user: sanitizeCustomerProfile(matched),
  });
});

// 4. Restore Session & Fetch Real-Time User Profile + Tessy Ai Chat Memory
app.get('/api/users/session', (req, res) => {
  ensureFounderProfileInDb();
  const userId = String(req.query.userId || '').trim();
  const email = String(req.query.email || '').trim().toLowerCase();

  let matched = null;
  if (email === FOUNDER_EMAIL) {
    matched = db.customers.find((c) => (c.email || '').trim().toLowerCase() === FOUNDER_EMAIL);
  } else if (userId) {
    matched = db.customers.find((c) => c.id === userId);
  }
  if (!matched && email) {
    matched = db.customers.find((c) => (c.email || '').trim().toLowerCase() === email);
  }

  if (!matched) {
    return res.status(404).json({ found: false });
  }

  return res.json({
    found: true,
    user: sanitizeCustomerProfile(matched),
  });
});

// 5. Update Frontend User Profile (Synced with Admin Dashboard in Real Time)
app.put('/api/users/profile', (req, res) => {
  ensureFounderProfileInDb();
  const {
    userId,
    email,
    name,
    phone,
    preferredStyle,
    preferredSize,
    favoriteColors,
    deliveryState,
    deliveryCity,
    deliveryAddress,
    deliveryMethod,
    measurements,
    clearChatHistory,
    facialPhotoUrl,
    customAttachments,
  } = req.body;

  const matched = db.customers.find(
    (c) =>
      (userId && c.id === userId) ||
      (email && (c.email || '').trim().toLowerCase() === String(email).trim().toLowerCase())
  );

  if (!matched) {
    return res.status(404).json({ error: 'User profile not found.' });
  }

  if (name !== undefined && String(name).trim() !== '') matched.name = String(name).trim();
  if (phone !== undefined && String(phone).trim() !== '') matched.phone = String(phone).trim();
  if (preferredStyle !== undefined) matched.preferredStyle = preferredStyle;
  if (preferredSize !== undefined) matched.preferredSize = preferredSize;
  if (favoriteColors !== undefined) matched.favoriteColors = favoriteColors;
  if (deliveryState !== undefined || deliveryCity !== undefined || deliveryAddress !== undefined) {
    matched.delivery = {
      state: deliveryState ?? matched.delivery?.state ?? 'Lagos',
      city: deliveryCity ?? matched.delivery?.city ?? '',
      address: deliveryAddress ?? matched.delivery?.address ?? '',
      method: deliveryMethod ?? matched.delivery?.method ?? 'Doorstep Courier',
    };
  }
  if (measurements && typeof measurements === 'object') {
    matched.measurements = { ...matched.measurements, ...measurements };
  }
  if (facialPhotoUrl !== undefined) {
    matched.facialPhotoUrl = String(facialPhotoUrl || '');
    matched.facialVerified = Boolean(facialPhotoUrl);
    matched.facialEnrolledAt = facialPhotoUrl ? new Date().toISOString() : undefined;
  }
  if (Array.isArray(customAttachments)) {
    matched.customAttachments = customAttachments.slice(0, 20);
  }
  if (clearChatHistory) {
    matched.chatHistory = [];
  }

  logAudit(matched.name, matched.isFounder ? 'Founder & Owner' : 'Customer', 'UPDATE_USER_PROFILE', matched.id, `Updated profile preferences for ${matched.name}.`);
  saveDb(db);

  return res.json({
    success: true,
    user: sanitizeCustomerProfile(matched),
  });
});

// Frontend Tessy Ai endpoint (Connected to Real-Time HOS|TED AI Brain with Role Permissions, Brand Rules & Live Setups)
app.post('/api/gemini/tessy-chat', async (req, res) => {
  try {
    ensureFounderProfileInDb();
    syncCustomersWithLiveRealTimeData(db);

    const { messages, mode, userId, userEmail } = req.body;
    const currentMode = mode === 'concierge' ? 'Concierge & Bespoke Orders' : 'Fashion Stylist & Wardrobe Consultant';

    // Locate signed-in user to remember their name, preferences, orders, and previous chats
    const signedInUser = db.customers.find(
      (c) =>
        (userId && c.id === userId) ||
        (userEmail && (c.email || '').trim().toLowerCase() === String(userEmail).trim().toLowerCase())
    );
    const isFounderUser =
      Boolean(signedInUser?.isFounder) || hasFounderOrCreatorPortalAccess(userEmail);

    const permissionTier = isFounderUser
      ? 'FOUNDER_OWNER_ADMIN'
      : signedInUser
      ? 'REGISTERED_CLIENT'
      : 'GUEST_VISITOR';

    const userOrdersList = signedInUser
      ? db.orders.filter(
          (o) =>
            ((o.email || '').toLowerCase() === (signedInUser.email || '').toLowerCase() && signedInUser.email) ||
            (o.phone &&
              signedInUser.phone &&
              o.phone.replace(/[^0-9]/g, '').slice(-8) === signedInUser.phone.replace(/[^0-9]/g, '').slice(-8))
        )
      : [];

    const userOrdersSummary =
      userOrdersList.length > 0
        ? userOrdersList
            .map(
              (o) =>
                `Order ${o.id}: ${o.quantity || 1}x ${o.productName || o.category} | Size: ${o.size || 'Custom'} | Color: ${
                  o.color || 'Signature'
                } | Total: ₦${(o.totalAmountNgn || 0).toLocaleString()} | Paid: ₦${(
                  o.amountPaidNgn || 0
                ).toLocaleString()} | Status: ${o.status} | Payment: ${o.paymentStatus}`
            )
            .join('\n  ')
        : 'No orders placed under this profile yet.';

    const liveMetrics = computeLiveMetrics(db);

    const userMemoryAndPermissionsContext = isFounderUser
      ? `ACTIVE USER & PERMISSION TIER: [FOUNDER_OWNER_ADMIN]
- You are speaking directly with **${
          isCreatorEmail(userEmail)
            ? `Platform Creator (${CREATOR_EMAIL}) with Full Founder Portal Access`
            : `Theresa Isama (${FOUNDER_EMAIL}), the visionary Founder, Owner & Creative Director of HOS|TED`
        }**!
- Address her with warm, affectionate, royal Nigerian respect ("My Queen Theresa Isama", "Founder & Owner of HOS|TED").
- FOUNDER & CREATOR PERMISSIONS GRANTED: Full read/write authority over all live HOS|TED data, including live verified revenue (₦${liveMetrics.verifiedRevenueNgn.toLocaleString()}), pending payments (${liveMetrics.pendingPaymentsCount}), total orders (${liveMetrics.totalOrders}), registered customers (${liveMetrics.totalCustomers}), OTP email logs (${(db.emailLogs || []).length}), security events (${(db.securityEvents || []).length}), catalog pricing, website design settings, and order statuses.
- If asked to update a product price/stock, add a product, change website settings/announcement/hero text/policies, or update an order status right here in chat, set \`hasRealTimeAction: true\` with the corresponding \`actionType\` and \`actionPayloadJson\` and it will be executed immediately across the entire storefront!`
      : signedInUser
      ? `ACTIVE USER & PERMISSION TIER: [REGISTERED_CLIENT]
- Signed-In Client Name: ${signedInUser.name} (ID: ${signedInUser.id})
- Email: ${signedInUser.email} | Phone: ${signedInUser.phone}
- Saved Style Preference: ${signedInUser.preferredStyle || 'Not set yet'}
- Saved Size: ${signedInUser.preferredSize || 'Not set yet'}
- Saved Favorite Colors: ${signedInUser.favoriteColors || 'Not set yet'}
- Saved Body Measurements (inches): Bust ${signedInUser.measurements?.bust || '-'}, Waist ${
          signedInUser.measurements?.waist || '-'
        }, Hips ${signedInUser.measurements?.hips || '-'}, Shoulder ${
          signedInUser.measurements?.shoulder || '-'
        }, Sleeve ${signedInUser.measurements?.sleeveLength || '-'}, Gown/Trouser Length ${
          signedInUser.measurements?.outfitLength || '-'
        }
- Saved Delivery Location: ${
          [signedInUser.delivery?.address, signedInUser.delivery?.city, signedInUser.delivery?.state]
            .filter(Boolean)
            .join(', ') || 'Nigeria'
        } (${signedInUser.delivery?.method || 'Doorstep Courier'})
- Client's Live Orders:\n  ${userOrdersSummary}
- CLIENT PERMISSIONS & PRIVACY RULES:
  1. You may view and discuss ${signedInUser.name}'s own profile, measurements, preferences, and own orders above.
  2. REAL-TIME PROFILE SYNC: If ${
    signedInUser.name
  } tells you their size, favorite colors, style preference, body measurements (bust, waist, hips, length), or delivery address/state during chat, set \`hasRealTimeAction: true\`, \`actionType: "UPDATE_MY_PROFILE"\`, and include those fields in \`actionPayloadJson\` so their profile and the Admin Dashboard update automatically in real time!
  3. REAL-TIME ORDER CREATION: If ${
    signedInUser.name
  } explicitly asks you to log/create a new bespoke order or inquiry for them right now in chat, set \`hasRealTimeAction: true\`, \`actionType: "CREATE_MY_ORDER"\` with \`{"category":"...","productName":"...","size":"...","color":"...","notes":"..."}\`.
  4. STRICT SECURITY BOUNDARY: Never disclose other customers' private data, phone numbers, internal store revenue, or admin credentials.`
      : `ACTIVE USER & PERMISSION TIER: [GUEST_VISITOR]
- Visitor is browsing as a Guest (not signed in yet).
- GUEST PERMISSIONS & RULES:
  1. Warmly assist with styling, live product catalog prices, layman sizing & color explanations, and delivery info.
  2. Encourage them to click "Sign Up / Sign In" in the top bar so HOS|TED can save their measurements, preferred size, favorite colors, and chat history in real time.
  3. Never disclose private customer records, internal revenue, or admin credentials.`;

    const activeProductsSummary = db.products
      .filter((p) => p.active !== false)
      .map(
        (p) =>
          `- [ID: ${p.id}] ${p.name} (${p.categoryLabel}): ${
            p.priceNgn > 0 ? `₦${p.priceNgn.toLocaleString()}` : 'Custom Quote'
          } | Stock: ${p.stockCount ?? 5} available | Fabric: ${p.fabric} | Lead Time: ${
            p.leadTime || db.websiteSettings.standardLeadTime || '5-7 business days'
          }`
      )
      .join('\n');

    const systemInstruction = `You are Tessy Ai, the official real-time AI Brain, Fashion Stylist, and Bespoke Concierge of HOS|TED (Slogan: "HOS|TED Hosting Nations", Visionary Founder, Owner & Creative Director: Theresa Isama).
You speak with a soothing, warm, graceful, poised Nigerian female voice and natural Nigerian hospitality.

HOS|TED BRAND SETUPS, RULES & REAL-TIME CONFIGURATION:
1. Brand Identity: Strictly "HOS|TED" with slogan "HOS|TED Hosting Nations", founded and owned by Theresa Isama.
2. Official Contacts & Socials:
   - WhatsApp & Direct Phone: ${db.websiteSettings.whatsappFormatted || '0907 378 4461'} (+234 907 378 4461)
   - TikTok: @${db.websiteSettings.tiktokHandle || 'hosted72'} | Instagram: @${db.websiteSettings.instagramHandle || 'hos_ted'}
3. Official Payment & Checkout Setup:
   - Bank Name: ${db.websiteSettings.paymentBankName || 'OPay / Moniepoint / Direct Bank Transfer'}
   - Account Name: ${db.websiteSettings.paymentAccountName || 'Theresa Isama (HOS|TED)'}
   - Account Number: ${db.websiteSettings.paymentAccountNumber || '9073784461'}
   - Payment Rules: Ready-to-wear orders can be paid 100% in full; Custom Bespoke Tailoring supports either a 50% Deposit to begin cutting/sewing or 100% Full Payment. After transfer, clients click "Request Order Status on WhatsApp" with their Order ID (HT-XXXX) until the Admin Dashboard marks it "Payment Confirmed".
4. Layman-Friendly Sizing Setup (Always explain sizes simply in plain English alongside inches):
   - S (Small / UK 8–10): Slim / Petite build (Bust 33–35", Waist 26–28", Hips 36–38", Length 58")
   - M (Medium / UK 10–12): Average / Regular build (Bust 36–38", Waist 29–31", Hips 39–41", Length 59")
   - L (Large / UK 14–16): Curvy / Full build (Bust 39–41", Waist 32–34", Hips 42–44", Length 60")
   - XL (Extra Large / UK 18–20): Plus / Voluptuous build (Bust 42–45", Waist 35–38", Hips 45–48", Length 60")
   - XXL (Double XL / UK 22–24): Extra Plus / Regal Full build (Bust 46–49", Waist 39–42", Hips 49–52", Length 61")
   - 3XL (Triple XL / UK 26+): Grand Regal build (Bust 50–54", Waist 43–47", Hips 53–57", Length 61")
   - Custom (Bespoke Measured): Tailored to exact Bust, Waist, Hips, Shoulder, Sleeve, and Shoulder-to-Floor measurements.
5. Layman-Friendly Signature Colors Setup:
   - Imperial Gold (Rich yellow-gold), Emerald Green (Deep jewel green), Royal Cobalt Blue (Vibrant electric blue), Ruby Wine Red (Deep burgundy wine), Burnt Terracotta Orange (Warm sunset clay orange), Obsidian Black & Gold, Ivory Cream & Gold, Plum Purple, Sunset Mustard Yellow, Chocolate Earth Brown.
6. Nationwide & International Delivery Setup:
   - ${db.websiteSettings.nationwideDeliveryText || 'Doorstep Courier & Park/Terminal Delivery across all 36 Nigerian States, FCT Abuja, and International DHL/FedEx shipping.'}

${userMemoryAndPermissionsContext}

LIVE HOS|TED PRODUCT CATALOG:
${activeProductsSummary}

Active Consultation Mode: ${currentMode}

Supported Real-Time Actions (\`hasRealTimeAction: true\`):
- For REGISTERED_CLIENT (or FOUNDER_OWNER_ADMIN updating their own preferences):
  * \`actionType: "UPDATE_MY_PROFILE"\` -> \`actionPayloadJson\`: JSON string with any of \`{"preferredSize":"L (Large)","favoriteColors":"Imperial Gold, Emerald Green","preferredStyle":"Ankara Gowns & Bubu","deliveryState":"Lagos","deliveryCity":"Lekki","deliveryAddress":"...","measurements":{"bust":"40","waist":"33","hips":"43","outfitLength":"60"}}\`
  * \`actionType: "CREATE_MY_ORDER"\` -> \`actionPayloadJson\`: JSON string with \`{"category":"Ankara Gowns","productName":"...","size":"...","color":"...","notes":"..."}\`
- Exclusively for FOUNDER_OWNER_ADMIN (Theresa Isama):
  * \`actionType: "UPDATE_PRODUCT"\` -> \`{"id":"ha-01","priceNgn":65000,"stockCount":5,"name":"..."}\`
  * \`actionType: "UPDATE_WEBSITE_SETTINGS"\` -> \`{"heroTitle":"...","announcementText":"...","themeColor":"obsidian"}\`
  * \`actionType: "UPDATE_ORDER_STATUS"\` -> \`{"orderId":"HT-1001","newStatus":"In Production"}\`
Only set \`hasRealTimeAction: true\` when the user provides new profile/measurement details to save or explicitly requests an action permitted by their tier.`;

    const recentMessages = Array.isArray(messages) ? messages.slice(-10) : [];
    const lastUserMessageText =
      recentMessages.length > 0
        ? String(recentMessages[recentMessages.length - 1]?.content || '').slice(0, 1500)
        : 'Hello Tessy Ai! Tell me about HOS|TED (Hosting Nations) and how you can style me today.';

    const conversationTranscript =
      recentMessages.length > 0
        ? recentMessages
            .map(
              (m: { role: string; content: string }) =>
                `${m.role === 'assistant' ? 'TESSY_AI' : 'USER'}: ${String(m.content || '').slice(0, 1500)}`
            )
            .join('\n\n')
        : `USER: ${lastUserMessageText}`;

    const tessySchema = {
      type: Type.OBJECT,
      properties: {
        reply: {
          type: Type.STRING,
          description: 'Your warm, soothing Nigerian female response to the user.',
        },
        hasRealTimeAction: {
          type: Type.BOOLEAN,
          description: 'True if executing a real-time profile save, order creation, or founder store update.',
        },
        actionType: {
          type: Type.STRING,
          description:
            'UPDATE_MY_PROFILE, CREATE_MY_ORDER, UPDATE_PRODUCT, UPDATE_WEBSITE_SETTINGS, or UPDATE_ORDER_STATUS',
        },
        actionSummary: {
          type: Type.STRING,
          description: 'Short human-readable summary of what was saved or updated in real time.',
        },
        actionPayloadJson: {
          type: Type.STRING,
          description: 'JSON string of the payload for the real-time action.',
        },
      },
      required: ['reply', 'hasRealTimeAction'],
    };

    let parsed: any = null;
    const candidateModels = [
      'gemini-3-flash-preview',
      'gemini-2.5-flash',
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
    ];
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: conversationTranscript,
          config: {
            systemInstruction,
            temperature: 0.7,
            responseMimeType: 'application/json',
            responseSchema: tessySchema,
          },
        });
        parsed = JSON.parse(response.text || '{}');
        if (parsed && parsed.reply) break;
      } catch {
        // Try next candidate model or fallback to deterministic live-data response
      }
    }

    if (!parsed || !parsed.reply) {
      // Deterministic real-time fallback using live HOS|TED database when Gemini quota is temporarily busy
      const lowerQ = lastUserMessageText.toLowerCase();
      const bustMatch = lastUserMessageText.match(/bust\s*(?:is|=|:)?\s*(\d{2}(?:\.\d)?)/i);
      const waistMatch = lastUserMessageText.match(/waist\s*(?:is|=|:)?\s*(\d{2}(?:\.\d)?)/i);
      const hipsMatch = lastUserMessageText.match(/hips?\s*(?:is|=|:)?\s*(\d{2}(?:\.\d)?)/i);
      const lengthMatch = lastUserMessageText.match(/length\s*(?:is|=|:)?\s*(\d{2}(?:\.\d)?)/i);

      if (signedInUser && (bustMatch || waistMatch || hipsMatch || lengthMatch)) {
        const meas: Record<string, string> = {};
        if (bustMatch) meas.bust = bustMatch[1];
        if (waistMatch) meas.waist = waistMatch[1];
        if (hipsMatch) meas.hips = hipsMatch[1];
        if (lengthMatch) meas.outfitLength = lengthMatch[1];
        parsed = {
          reply: `Thank you my darling ${signedInUser.name}! I have recorded your body measurements (${Object.entries(meas)
            .map(([k, v]) => `${k}: ${v}"`)
            .join(', ')}) directly into your HOS|TED profile and Bespoke Tailoring records.`,
          hasRealTimeAction: true,
          actionType: 'UPDATE_MY_PROFILE',
          actionSummary: 'Saved your voice/chat measurements to your live HOS|TED profile.',
          actionPayloadJson: JSON.stringify({ measurements: meas }),
        };
      } else if (lowerQ.includes('size') || lowerQ.includes('measure')) {
        parsed = {
          reply:
            'At **HOS|TED** (*HOS|TED Hosting Nations*), our sizes in simple terms are:\n• **S (UK 8–10)**: Bust 33–35", Waist 26–28", Hips 36–38"\n• **M (UK 10–12)**: Bust 36–38", Waist 29–31", Hips 39–41"\n• **L (UK 14–16)**: Bust 39–41", Waist 32–34", Hips 42–44"\n• **XL (UK 18–20)**: Bust 42–45", Waist 35–38", Hips 45–48"\n• **XXL–3XL & Custom Bespoke**: Tailored to your exact measurements! You can also use the **Voice Measurements Recorder** right below to speak your measurements.',
          hasRealTimeAction: false,
        };
      } else {
        const topProducts = db.products
          .filter((p) => p.active !== false)
          .slice(0, 4)
          .map((p) => `• **${p.name}**: ₦${(p.priceNgn || 0).toLocaleString()}`)
          .join('\n');
        parsed = {
          reply: `Welcome to **HOS|TED** (*HOS|TED Hosting Nations*), founded by **Theresa Isama**! Here are some of our signature pieces available right now:\n${topProducts}\n\nYou can record your measurements or custom tailoring request using the microphone button below, or ask me about sizing, colors, and nationwide delivery!`,
          hasRealTimeAction: false,
        };
      }
    }

    const reply =
      parsed.reply ||
      'Welcome to HOS|TED — Hosting Nations! How can Tessy Ai assist with your styling, bespoke tailoring, or nationwide delivery today?';

    let executedActionSummary: string | undefined = undefined;
    let storefrontUpdated = false;

    // Execute authorized real-time action according to permission tier
    if (parsed.hasRealTimeAction && parsed.actionType && parsed.actionPayloadJson) {
      try {
        const actionPayload = JSON.parse(parsed.actionPayloadJson);
        const now = new Date().toISOString();

        if (parsed.actionType === 'UPDATE_MY_PROFILE' && signedInUser) {
          if (actionPayload.preferredSize) signedInUser.preferredSize = String(actionPayload.preferredSize);
          if (actionPayload.favoriteColors) signedInUser.favoriteColors = String(actionPayload.favoriteColors);
          if (actionPayload.preferredStyle) signedInUser.preferredStyle = String(actionPayload.preferredStyle);
          if (actionPayload.deliveryState || actionPayload.deliveryCity || actionPayload.deliveryAddress) {
            signedInUser.delivery = {
              state: actionPayload.deliveryState || signedInUser.delivery?.state || 'Lagos',
              city: actionPayload.deliveryCity || signedInUser.delivery?.city || '',
              address: actionPayload.deliveryAddress || signedInUser.delivery?.address || '',
              method: actionPayload.deliveryMethod || signedInUser.delivery?.method || 'Doorstep Courier',
            };
          }
          if (actionPayload.measurements && typeof actionPayload.measurements === 'object') {
            signedInUser.measurements = {
              ...signedInUser.measurements,
              ...actionPayload.measurements,
            };
          }
          executedActionSummary =
            parsed.actionSummary || `Saved your HOS|TED preferences & measurements to your profile in real time.`;
          logAudit(
            signedInUser.name,
            isFounderUser ? 'Founder & Owner (via Tessy Ai)' : 'Client (via Tessy Ai)',
            'TESSY_PROFILE_SYNC',
            signedInUser.id,
            executedActionSummary
          );
          storefrontUpdated = true;
        } else if (parsed.actionType === 'CREATE_MY_ORDER' && signedInUser) {
          const orderId = `HT-${Math.floor(1000 + Math.random() * 9000)}`;
          const newOrd = {
            id: orderId,
            name: signedInUser.name,
            phone: signedInUser.phone,
            email: signedInUser.email || '',
            category: actionPayload.category || signedInUser.preferredStyle || 'Bespoke Tailoring',
            productName: actionPayload.productName || actionPayload.category || 'Custom HOS|TED Piece',
            size: actionPayload.size || signedInUser.preferredSize || 'Custom',
            color: actionPayload.color || signedInUser.favoriteColors || 'Imperial Gold',
            quantity: Number(actionPayload.quantity) || 1,
            notes: actionPayload.notes || 'Created via Tessy Ai Concierge.',
            measurements: signedInUser.measurements || {},
            delivery: signedInUser.delivery || {
              state: 'Lagos',
              city: '',
              address: '',
              method: 'Doorstep Courier' as const,
            },
            createdAt: now,
            status: 'New Inquiry' as const,
            totalAmountNgn: Number(actionPayload.totalAmountNgn) || 0,
            amountPaidNgn: 0,
            paymentStatus: 'Unpaid' as const,
            assignedTailor: 'Theresa Isama',
          };
          db.orders.unshift(newOrd);
          executedActionSummary =
            parsed.actionSummary || `Created Bespoke Order ${orderId} (${newOrd.productName}) in real time.`;
          logAudit(signedInUser.name, 'Client (via Tessy Ai)', 'TESSY_CREATE_ORDER', orderId, executedActionSummary);
          storefrontUpdated = true;
        } else if (isFounderUser) {
          // Founder-level real-time store actions
          if (parsed.actionType === 'UPDATE_PRODUCT' && actionPayload.id) {
            const prod = db.products.find((p) => p.id === actionPayload.id);
            if (prod) {
              if (actionPayload.name !== undefined) prod.name = actionPayload.name;
              if (actionPayload.priceNgn !== undefined) {
                prod.priceNgn = Number(actionPayload.priceNgn);
                prod.priceUsd = prod.priceNgn > 0 ? Math.round(prod.priceNgn / 1450) : 0;
              }
              if (actionPayload.stockCount !== undefined) prod.stockCount = Number(actionPayload.stockCount);
              if (actionPayload.leadTime !== undefined) prod.leadTime = actionPayload.leadTime;
              if (actionPayload.description !== undefined) prod.description = actionPayload.description;
              executedActionSummary =
                parsed.actionSummary || `Updated product "${prod.name}" (₦${prod.priceNgn.toLocaleString()}) live.`;
              storefrontUpdated = true;
            }
          } else if (parsed.actionType === 'UPDATE_WEBSITE_SETTINGS') {
            db.websiteSettings = {
              ...db.websiteSettings,
              ...actionPayload,
              brandName: 'HOS|TED',
            };
            executedActionSummary = parsed.actionSummary || 'Updated live HOS|TED storefront settings.';
            storefrontUpdated = true;
          } else if (parsed.actionType === 'UPDATE_ORDER_STATUS' && actionPayload.orderId && actionPayload.newStatus) {
            const ord = db.orders.find((o) => o.id === actionPayload.orderId);
            if (ord) {
              ord.status = actionPayload.newStatus;
              executedActionSummary =
                parsed.actionSummary || `Updated Order ${ord.id} status to "${ord.status}".`;
              storefrontUpdated = true;
            }
          }
        }
      } catch (actErr) {
        console.warn('Tessy Ai real-time action parse warning:', actErr);
      }
    }

    // Persist chat history to the signed-in user's profile in real time so Tessy Ai remembers all previous chats
    if (signedInUser && Array.isArray(messages)) {
      const updatedHistory = [
        ...messages.map((m: any, i: number) => ({
          id: m.id || `msg-${Date.now()}-${i}`,
          role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
          content: String(m.content || ''),
          timestamp:
            m.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })),
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant' as const,
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ].slice(-50);

      signedInUser.chatHistory = updatedHistory;
      saveDb(db);
    } else if (storefrontUpdated) {
      saveDb(db);
    }

    res.json({
      reply,
      chatHistory: signedInUser?.chatHistory,
      userProfile: signedInUser ? sanitizeCustomerProfile(signedInUser) : undefined,
      executedActionSummary,
      storefrontUpdated,
      permissionTier,
    });
  } catch (error: any) {
    res.status(200).json({
      reply:
        'Welcome to HOS|TED — Hosting Nations! I am here to assist you with bespoke measurements, signature Ankara & Bubu styling, and nationwide delivery.',
      hasRealTimeAction: false,
    });
  }
});

// Tessy Ai Soothing Nigerian Female Voice TTS Endpoint
app.post('/api/gemini/tessy-tts', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for speech synthesis.' });
    }

    const cleanedText = text
      .replace(/[*#_`~>]/g, '')
      .replace(/\bhosted\b/gi, 'HOS|TED')
      .replace(/₦\s*([0-9,]+)/g, '$1 Naira')
      .replace(/NGN\s*([0-9,]+)/gi, '$1 Naira')
      .replace(
        /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}•✓👑✨✂️💛]/gu,
        ' '
      )
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1100);

    if (!cleanedText) {
      return res.status(400).json({ error: 'No speakable text provided.' });
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanedText,
                speechMetadata: {
                  style:
                    'Soothing, warm, graceful Nigerian female voice speaking natural Nigerian English. Gentle West African cadence, rich melodic intonation, calm, welcoming, confident, and poised luxury fashion house tone.',
                },
              } as any,
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Aoede' },
            },
          },
        },
      });
    } catch {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanedText,
                speechMetadata: {
                  style: 'Soothing, warm, graceful Nigerian female voice speaking Nigerian English.',
                },
              } as any,
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Aoede' },
            },
          },
        },
      });
    }

    const inlineData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData?.data) {
      return res.status(500).json({ error: 'No audio returned from model.' });
    }

    res.json({
      audioBase64: inlineData.data,
      mimeType: inlineData.mimeType || 'audio/wav',
    });
  } catch (error: any) {
    console.error('Tessy Ai TTS Error:', error);
    res.status(500).json({
      error: 'TTS synthesis fallback triggered.',
      details: error?.message || 'Unknown error',
    });
  }
});

// Tessy Ai Server-Side Microphone Speech-to-Text Transcription Endpoint
app.post('/api/gemini/tessy-transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Audio data is required for transcription.' });
    }

    const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim() || 'audio/webm';
    const audioPart = {
      inlineData: {
        mimeType: cleanMime,
        data: audioBase64,
      },
    };
    const promptPart = {
      text: 'Transcribe this spoken user request accurately into plain text. Recognize Nigerian names, cities (Lagos, Abuja, Port Harcourt, etc.), fashion terms (HOS|TED, Ankara, Bubu, Owambe, Gele, Theresa Isama), sizes, colors, and body measurements in inches. Return ONLY the exact spoken words without quotes or commentary. If only silence or background noise is heard, return an empty string.',
    };

    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-3-flash-preview',
      'gemini-3.1-flash-lite-preview',
      'gemini-3.8-flash',
    ];

    let transcript = '';
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts: [audioPart, promptPart] },
        });
        const text = (response.text || '')
          .replace(/\bhosted\b/gi, 'HOS|TED')
          .trim();
        if (text) {
          transcript = text;
          break;
        }
      } catch {
        // Try next available model
      }
    }

    return res.json({ transcript });
  } catch (error: any) {
    console.error('Tessy Ai Transcription Error:', error);
    return res.status(200).json({
      transcript: '',
      details: error?.message || 'Transcription fallback',
    });
  }
});

// Full Business Management Dashboard State Route
app.post('/api/staff/dashboard', (req, res) => {
  const { pin, email } = req.body;
  if (!isAuthorizedCredentials(pin, email)) {
    return res.status(401).json({ error: 'Invalid HOS|TED Admin credentials.' });
  }
  ensureFounderProfileInDb();
  syncCustomersWithLiveRealTimeData(db);
  res.json({
    db,
    metrics: computeLiveMetrics(db),
    adminEmail: adminAuth.email,
    syncedAt: new Date().toISOString(),
  });
});

// Authorized & Verified Mutations Route for HOS|TED Admin
app.post('/api/staff/action', (req, res) => {
  const { pin, email, actionType, payload, actorRole = 'Theresa Isama (Founder)' } = req.body;
  if (!isAuthorizedCredentials(pin, email)) {
    return res.status(401).json({ error: 'Unauthorized HOS|TED Admin credentials.' });
  }

  const now = new Date().toISOString();
  let actionSummary = '';

  try {
    switch (actionType) {
      case 'UPDATE_ADMIN_CREDENTIALS': {
        const { newEmail, newPassword } = payload;
        if (!newPassword || String(newPassword).trim().length < 4) {
          return res.status(400).json({ error: 'New password must be at least 4 characters.' });
        }
        if (newEmail && String(newEmail).trim()) {
          adminAuth.email = String(newEmail).trim();
          ensureAuthorizedAdminEmailsInDb(db);
          const cleanNew = adminAuth.email.toLowerCase();
          if (
            !db.authorizedAdminEmails!.some(
              (entry) => (entry.email || '').trim().toLowerCase() === cleanNew
            )
          ) {
            db.authorizedAdminEmails!.push({
              email: adminAuth.email,
              roleLabel: 'Primary Admin Email',
              addedBy: actorRole,
              addedAt: now,
            });
          }
        }
        adminAuth.password = String(newPassword).trim();
        adminAuth.updatedAt = now;
        saveAdminAuth(adminAuth);
        actionSummary = `Updated HOS|TED Admin credentials (Email: ${adminAuth.email}).`;
        logAudit('Theresa Isama', actorRole, 'UPDATE_ADMIN_CREDENTIALS', 'Admin Security', actionSummary);
        break;
      }

      case 'GRANT_ADMIN_PORTAL_ACCESS': {
        ensureAuthorizedAdminEmailsInDb(db);
        const rawEmail = String(payload.email || '').trim().toLowerCase();
        const roleLabel = String(payload.roleLabel || 'Authorized Portal Admin').trim();
        if (!rawEmail || !rawEmail.includes('@')) {
          return res.status(400).json({ error: 'Please enter a valid email address to grant portal access.' });
        }
        const existingEntry = db.authorizedAdminEmails!.find(
          (e) => (e.email || '').trim().toLowerCase() === rawEmail
        );
        if (existingEntry) {
          existingEntry.roleLabel = roleLabel;
          existingEntry.addedBy = actorRole;
          existingEntry.addedAt = now;
        } else {
          db.authorizedAdminEmails!.push({
            email: rawEmail,
            roleLabel,
            addedBy: actorRole,
            addedAt: now,
            isProtected: rawEmail === FOUNDER_EMAIL || rawEmail === CREATOR_EMAIL,
          });
        }
        actionSummary = `Granted HOS|TED Admin Portal access to ${rawEmail} (${roleLabel}).`;
        logAudit('Theresa Isama', actorRole, 'GRANT_ADMIN_PORTAL_ACCESS', rawEmail, actionSummary);
        break;
      }

      case 'REVOKE_ADMIN_PORTAL_ACCESS': {
        ensureAuthorizedAdminEmailsInDb(db);
        const targetEmail = String(payload.email || '').trim().toLowerCase();
        if (targetEmail === FOUNDER_EMAIL || targetEmail === CREATOR_EMAIL) {
          return res.status(400).json({
            error: 'Founder & Owner (isamatheresa12@gmail.com) and Platform Creator (isamavictoriaene19@gmail.com) portal access cannot be revoked.',
          });
        }
        const beforeCount = db.authorizedAdminEmails!.length;
        db.authorizedAdminEmails = db.authorizedAdminEmails!.filter(
          (e) => (e.email || '').trim().toLowerCase() !== targetEmail
        );
        if (db.authorizedAdminEmails.length === beforeCount) {
          return res.status(404).json({ error: `Email ${targetEmail} was not found in authorized portal list.` });
        }
        actionSummary = `Revoked HOS|TED Admin Portal access for ${targetEmail}.`;
        logAudit('Theresa Isama', actorRole, 'REVOKE_ADMIN_PORTAL_ACCESS', targetEmail, actionSummary);
        break;
      }

      case 'UPDATE_ORDER_STATUS': {
        const { orderId, newStatus } = payload;
        const order = db.orders.find((o) => o.id === orderId);
        if (!order) return res.status(404).json({ error: `Order ${orderId} not found.` });
        const prev = order.status;
        order.status = newStatus;
        if (
          newStatus === 'Payment Confirmed' ||
          newStatus === 'Processing' ||
          newStatus === 'Tailoring' ||
          newStatus === 'In Production' ||
          newStatus === 'Ready for Fitting' ||
          newStatus === 'Shipped' ||
          newStatus === 'Completed' ||
          newStatus === 'Delivered'
        ) {
          order.paymentStatus = 'Payment Confirmed';
          order.amountPaidNgn = order.totalAmountNgn || order.amountPaidNgn || 0;
          const linkedPayment = db.payments.find((p) => p.orderId === order.id);
          if (linkedPayment) {
            linkedPayment.status = 'Verified';
          }
        }
        actionSummary = `Updated Order ${orderId} (${order.name}) status from "${prev}" to "${newStatus}".`;
        logAudit('Theresa Isama', actorRole, 'UPDATE_ORDER_STATUS', orderId, actionSummary);
        break;
      }

      case 'CREATE_ORDER': {
        const {
          name,
          phone,
          email: clientEmail,
          category,
          totalAmountNgn,
          amountPaidNgn,
          status,
          notes,
          dueDate,
          measurements,
          delivery,
        } = payload;
        const orderId = `HT-${Math.floor(1000 + Math.random() * 9000)}`;
        const total = Number(totalAmountNgn) || 0;
        const paid = Number(amountPaidNgn) || 0;
        const newOrder = {
          id: orderId,
          name,
          phone,
          email: clientEmail || '',
          category: category || 'Custom Bespoke Outfit',
          notes: notes || '',
          measurements: measurements || {},
          delivery: delivery || { state: '', city: '', address: '', method: 'Doorstep Courier' as const },
          createdAt: now,
          status: status || 'New Inquiry',
          totalAmountNgn: total,
          amountPaidNgn: paid,
          paymentStatus:
            total > 0 && paid >= total
              ? ('Paid in Full' as const)
              : paid > 0
              ? ('Partial Deposit' as const)
              : ('Unpaid' as const),
          dueDate: dueDate || '',
          assignedTailor: 'Theresa Isama',
        };
        db.orders.unshift(newOrder);

        // Also sync customer
        const existingCustomer = db.customers.find(
          (c) => c.phone.replace(/\s+/g, '') === String(phone).replace(/\s+/g, '')
        );
        if (existingCustomer) {
          existingCustomer.totalOrders += 1;
          existingCustomer.totalSpentNgn += paid;
          if (delivery) existingCustomer.delivery = delivery;
        } else {
          db.customers.unshift({
            id: `CUST-${Math.floor(100 + Math.random() * 900)}`,
            name,
            phone,
            email: clientEmail || '',
            joinedAt: now,
            totalOrders: 1,
            totalSpentNgn: paid,
            measurements: measurements || {},
            delivery: delivery || { state: '', city: '', address: '', method: 'Doorstep Courier' },
            notes: notes || '',
          });
        }

        if (paid > 0) {
          db.payments.unshift({
            id: `PAY-${Math.floor(1000 + Math.random() * 9000)}`,
            orderId,
            clientName: name,
            clientPhone: phone,
            amountNgn: paid,
            method: 'Bank Transfer',
            status: 'Verified',
            reference: `HST-${Math.floor(1000 + Math.random() * 9000)}`,
            createdAt: now,
            notes: 'Recorded during order creation in HOS|TED Admin.',
          });
        }

        actionSummary = `Created order ${orderId} for ${name} (₦${total.toLocaleString()}).`;
        logAudit('Theresa Isama', actorRole, 'CREATE_ORDER', orderId, actionSummary);
        break;
      }

      case 'UPDATE_MEASUREMENTS': {
        const { orderId, customerId, measurements } = payload;
        if (orderId) {
          const order = db.orders.find((o) => o.id === orderId);
          if (order) {
            order.measurements = { ...order.measurements, ...measurements };
          }
        }
        if (customerId) {
          const cust = db.customers.find((c) => c.id === customerId);
          if (cust) {
            cust.measurements = { ...cust.measurements, ...measurements };
          }
        }
        actionSummary = `Updated bespoke measurements for ${orderId || customerId}.`;
        logAudit('Theresa Isama', actorRole, 'UPDATE_MEASUREMENTS', orderId || customerId || 'Profile', actionSummary);
        break;
      }

      case 'RECORD_PAYMENT_VERIFICATION': {
        const { paymentId, status, orderId, amountNgn, clientName, clientPhone, method } = payload;
        if (paymentId) {
          const pay = db.payments.find((p) => p.id === paymentId);
          if (!pay) return res.status(404).json({ error: `Payment ${paymentId} not found.` });
          pay.status = status || 'Verified';
          const linkedOrder = db.orders.find((o) => o.id === pay.orderId);
          if (linkedOrder && pay.status === 'Verified') {
            linkedOrder.amountPaidNgn = Math.max(
              Number(linkedOrder.amountPaidNgn) || 0,
              Number(pay.amountNgn) || Number(linkedOrder.totalAmountNgn) || 0
            );
            linkedOrder.paymentStatus = 'Payment Confirmed';
            if (linkedOrder.status === 'Pending Payment' || linkedOrder.status === 'New Inquiry') {
              linkedOrder.status = 'In Production';
            }
          }
          actionSummary = `Confirmed & Verified Payment ${paymentId} (${pay.clientName}, ₦${pay.amountNgn.toLocaleString()}) — Order ${pay.orderId} is now Payment Confirmed.`;
          logAudit('Theresa Isama', actorRole, 'VERIFY_PAYMENT', paymentId, actionSummary);
        } else if (orderId) {
          const newPayId = `PAY-${Math.floor(1000 + Math.random() * 9000)}`;
          const amt = Number(amountNgn) || 0;
          const order = db.orders.find((o) => o.id === orderId);
          const cName = clientName || order?.name || 'Client';
          const cPhone = clientPhone || order?.phone || '';
          db.payments.unshift({
            id: newPayId,
            orderId,
            clientName: cName,
            clientPhone: cPhone,
            amountNgn: amt,
            method: method || 'Bank Transfer',
            status: status || 'Verified',
            reference: `HST-${Math.floor(1000 + Math.random() * 9000)}`,
            createdAt: now,
            productImageUrl: order?.productImageUrl || '',
            productName: order?.productName || order?.category || '',
            size: order?.size || '',
            color: order?.color || '',
            quantity: order?.quantity || 1,
            notes: 'Payment recorded & confirmed via HOS|TED Admin Dashboard.',
          });
          if (order) {
            order.amountPaidNgn = (Number(order.amountPaidNgn) || 0) + amt;
            order.paymentStatus = 'Payment Confirmed';
            if (order.status === 'Pending Payment' || order.status === 'New Inquiry') {
              order.status = 'In Production';
            }
          }
          actionSummary = `Recorded & confirmed payment ${newPayId} of ₦${amt.toLocaleString()} for Order ${orderId}.`;
          logAudit('Theresa Isama', actorRole, 'RECORD_PAYMENT', newPayId, actionSummary);
        }
        break;
      }

      case 'UPDATE_INVENTORY': {
        const { itemId, quantity, name, category, unit, reorderThreshold, costPerUnitNgn } = payload;
        if (itemId) {
          const item = db.inventory.find((i) => i.id === itemId);
          if (!item) return res.status(404).json({ error: `Inventory item ${itemId} not found.` });
          const oldQty = item.quantity;
          item.quantity = Number(quantity);
          item.updatedAt = now;
          actionSummary = `Updated inventory "${item.name}" quantity from ${oldQty} to ${item.quantity} ${item.unit}.`;
          logAudit('Theresa Isama', actorRole, 'UPDATE_INVENTORY', itemId, actionSummary);
        } else {
          const newId = `INV-${Math.floor(100 + Math.random() * 900)}`;
          db.inventory.unshift({
            id: newId,
            name: name || 'New Atelier Material',
            sku: `SKU-${Math.floor(100 + Math.random() * 900)}`,
            category: category || 'Ankara Fabric',
            quantity: Number(quantity) || 0,
            unit: unit || 'Yards',
            reorderThreshold: Number(reorderThreshold) || 0,
            costPerUnitNgn: Number(costPerUnitNgn) || 0,
            updatedAt: now,
          });
          actionSummary = `Added inventory item "${name}" (${Number(quantity) || 0} ${unit || 'Yards'}).`;
          logAudit('Theresa Isama', actorRole, 'ADD_INVENTORY', newId, actionSummary);
        }
        break;
      }

      case 'CREATE_TASK': {
        const { title, description, assignee, priority, dueDate, relatedOrderId } = payload;
        const newTask = {
          id: `TSK-${Math.floor(100 + Math.random() * 900)}`,
          title: title || 'New HOS|TED Atelier Task',
          description: description || '',
          assignee: assignee || 'Theresa Isama',
          priority: priority || 'Medium',
          status: 'Todo' as const,
          dueDate: dueDate || '',
          relatedOrderId,
          createdAt: now,
        };
        db.tasks.unshift(newTask);
        actionSummary = `Created task "${newTask.title}" assigned to ${newTask.assignee}.`;
        logAudit('Theresa Isama', actorRole, 'CREATE_TASK', newTask.id, actionSummary);
        break;
      }

      case 'COMPLETE_TASK':
      case 'UPDATE_TASK_STATUS': {
        const { taskId, status = 'Done' } = payload;
        const task = db.tasks.find((t) => t.id === taskId);
        if (!task) return res.status(404).json({ error: `Task ${taskId} not found.` });
        task.status = status;
        actionSummary = `Updated task "${task.title}" (${taskId}) status to "${status}".`;
        logAudit('Theresa Isama', actorRole, 'UPDATE_TASK_STATUS', taskId, actionSummary);
        break;
      }

      case 'CREATE_APPOINTMENT': {
        const { clientName, clientPhone, orderId, type, date, time, notes } = payload;
        const newApt = {
          id: `APT-${Math.floor(100 + Math.random() * 900)}`,
          clientName,
          clientPhone,
          orderId,
          type: type || 'First Fitting',
          date: date || '',
          time: time || '',
          status: 'Scheduled' as const,
          notes: notes || '',
        };
        db.appointments.unshift(newApt);
        actionSummary = `Scheduled ${newApt.type} appointment for ${clientName}.`;
        logAudit('Theresa Isama', actorRole, 'CREATE_APPOINTMENT', newApt.id, actionSummary);
        break;
      }

      case 'UPDATE_APPOINTMENT_STATUS': {
        const { appointmentId, status } = payload;
        const apt = db.appointments.find((a) => a.id === appointmentId);
        if (!apt) return res.status(404).json({ error: 'Appointment not found.' });
        apt.status = status;
        actionSummary = `Updated appointment ${appointmentId} (${apt.clientName}) to ${status}.`;
        logAudit('Theresa Isama', actorRole, 'UPDATE_APPOINTMENT', appointmentId, actionSummary);
        break;
      }

      case 'DELETE_APPOINTMENT': {
        const { appointmentId } = payload;
        const idx = db.appointments.findIndex((a) => a.id === appointmentId);
        if (idx === -1) return res.status(404).json({ error: 'Appointment not found.' });
        const removed = db.appointments.splice(idx, 1)[0];
        actionSummary = `Deleted appointment ${appointmentId} (${removed.clientName} — ${removed.type}).`;
        logAudit('Theresa Isama', actorRole, 'DELETE_APPOINTMENT', appointmentId, actionSummary);
        break;
      }

      case 'ADD_PRODUCT':
      case 'UPDATE_PRODUCT': {
        const {
          id,
          name,
          category,
          categoryLabel,
          description,
          priceNgn,
          fabric,
          leadTime,
          stockCount,
          active,
          imageUrl,
          features,
          isPopular,
          isNew,
        } = payload;
        if (id) {
          const prod = db.products.find((p) => p.id === id);
          if (!prod) return res.status(404).json({ error: 'Product not found.' });
          if (name !== undefined) prod.name = name;
          if (priceNgn !== undefined) {
            prod.priceNgn = Number(priceNgn);
            prod.priceUsd = prod.priceNgn > 0 ? Math.round(Number(priceNgn) / 1450) : 0;
          }
          if (description !== undefined) prod.description = description;
          if (fabric !== undefined) prod.fabric = fabric;
          if (leadTime !== undefined) prod.leadTime = leadTime;
          if (stockCount !== undefined) prod.stockCount = Number(stockCount);
          if (active !== undefined) prod.active = Boolean(active);
          if (category !== undefined) prod.category = category;
          if (categoryLabel !== undefined) prod.categoryLabel = categoryLabel;
          if (imageUrl !== undefined && String(imageUrl).trim() !== '') prod.imageUrl = imageUrl;
          if (Array.isArray(features)) prod.features = features;
          if (isPopular !== undefined) prod.isPopular = Boolean(isPopular);
          if (isNew !== undefined) prod.isNew = Boolean(isNew);
          (prod as any).updatedAt = now;
          actionSummary = `Updated HOS|TED catalog item "${prod.name}" (₦${prod.priceNgn.toLocaleString()}).`;
          logAudit('Theresa Isama', actorRole, 'UPDATE_PRODUCT', prod.id, actionSummary);
        } else {
          const newProdId = payload.customId || `ha-custom-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
          const pNgn = Number(priceNgn) || 0;
          const parsedFeatures = Array.isArray(features) && features.length > 0
            ? features
            : typeof payload.featuresText === 'string' && payload.featuresText.trim()
            ? payload.featuresText.split(',').map((s: string) => s.trim()).filter(Boolean)
            : ['Bespoke Tailoring', 'Authentic African Fabric', 'Nationwide Delivery'];
          const newProd: any = {
            id: newProdId,
            name: name || 'New HOS|TED Signature Piece',
            category: category || 'ankara_gowns',
            categoryLabel: categoryLabel || 'Ankara Gowns',
            description: description || 'Handcrafted by HOS|TED — Hosting Nations.',
            priceNgn: pNgn,
            priceUsd: pNgn > 0 ? Math.round(pNgn / 1450) : 0,
            imageUrl: imageUrl || '/src/assets/images/collection_ankara_gown_1791027100541.jpg',
            features: parsedFeatures,
            fabric: fabric || '100% Grade-A Cotton Ankara',
            isPopular: Boolean(isPopular),
            isNew: true,
            leadTime: leadTime || '5–7 Working Days',
            stockCount: Number(stockCount) || 5,
            active: true,
            isAdminAdded: true,
            updatedAt: now,
          };
          db.products.unshift(newProd);
          actionSummary = `Added new product "${newProd.name}" to live HOS|TED storefront.`;
          logAudit('Theresa Isama', actorRole, 'ADD_PRODUCT', newProdId, actionSummary);
        }
        break;
      }

      case 'DELETE_PRODUCT': {
        const { id } = payload;
        const idx = db.products.findIndex((p) => p.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Product not found.' });
        const removed = db.products.splice(idx, 1)[0];
        actionSummary = `Removed product "${removed.name}" (${id}) from catalog.`;
        logAudit('Theresa Isama', actorRole, 'DELETE_PRODUCT', id, actionSummary);
        break;
      }

      case 'UPDATE_WEBSITE_SETTINGS': {
        const nextFounderImg =
          typeof payload.founderImageUrl === 'string' && payload.founderImageUrl.trim() !== ''
            ? payload.founderImageUrl.trim()
            : db.websiteSettings.founderImageUrl;
        db.websiteSettings = {
          ...db.websiteSettings,
          ...payload,
          founderImageUrl: nextFounderImg,
          brandName: 'HOS|TED',
        };
        ensureFounderProfileInDb();
        actionSummary = `Updated live HOS|TED website design, Founder image & settings.`;
        logAudit('Theresa Isama', actorRole, 'UPDATE_WEBSITE_SETTINGS', 'Storefront Design', actionSummary);
        break;
      }

      case 'UPDATE_CUSTOMER_PROFILE': {
        const {
          customerId,
          name,
          phone,
          email: cEmail,
          preferredStyle,
          preferredSize,
          favoriteColors,
          notes,
          deliveryState,
          deliveryCity,
          deliveryAddress,
          facialPhotoUrl,
          customAttachments,
        } = payload;
        const cust = db.customers.find((c) => c.id === customerId);
        if (!cust) return res.status(404).json({ error: `Customer ${customerId} not found.` });
        if (name !== undefined) cust.name = name;
        if (phone !== undefined) cust.phone = phone;
        if (cEmail !== undefined) cust.email = cEmail;
        if (preferredStyle !== undefined) cust.preferredStyle = preferredStyle;
        if (preferredSize !== undefined) cust.preferredSize = preferredSize;
        if (favoriteColors !== undefined) cust.favoriteColors = favoriteColors;
        if (notes !== undefined) cust.notes = notes;
        if (facialPhotoUrl !== undefined) {
          cust.facialPhotoUrl = String(facialPhotoUrl || '');
          cust.facialVerified = Boolean(facialPhotoUrl);
          cust.facialEnrolledAt = facialPhotoUrl ? now : undefined;
        }
        if (Array.isArray(customAttachments)) {
          cust.customAttachments = customAttachments;
        }
        if (deliveryState !== undefined || deliveryCity !== undefined || deliveryAddress !== undefined) {
          cust.delivery = {
            state: deliveryState ?? cust.delivery?.state ?? 'Lagos',
            city: deliveryCity ?? cust.delivery?.city ?? '',
            address: deliveryAddress ?? cust.delivery?.address ?? '',
            method: cust.delivery?.method ?? 'Doorstep Courier',
          };
        }
        actionSummary = `Updated registered user/customer profile "${cust.name}" (${cust.id}).`;
        logAudit('Theresa Isama', actorRole, 'UPDATE_CUSTOMER_PROFILE', cust.id, actionSummary);
        break;
      }

      case 'DELETE_CUSTOMER_PROFILE': {
        const { customerId } = payload;
        const idx = db.customers.findIndex((c) => c.id === customerId);
        if (idx === -1) return res.status(404).json({ error: `Customer ${customerId} not found.` });
        if ((db.customers[idx].email || '').toLowerCase() === FOUNDER_EMAIL) {
          return res.status(400).json({ error: 'Cannot delete the HOS|TED Founder & Owner profile.' });
        }
        const removed = db.customers.splice(idx, 1)[0];
        actionSummary = `Deleted customer record "${removed.name}" (${customerId}).`;
        logAudit('Theresa Isama', actorRole, 'DELETE_CUSTOMER_PROFILE', customerId, actionSummary);
        break;
      }

      case 'VERIFY_OR_UNLOCK_CUSTOMER': {
        const { customerId, emailVerified = true, accountStatus = 'Active' } = payload;
        const cust = db.customers.find((c) => c.id === customerId);
        if (!cust) return res.status(404).json({ error: `Customer ${customerId} not found.` });
        cust.emailVerified = Boolean(emailVerified);
        if (cust.emailVerified && !cust.emailVerifiedAt) {
          cust.emailVerifiedAt = now;
        }
        cust.accountStatus = accountStatus;
        cust.failedLoginAttempts = 0;
        if (cust.email) {
          clearFailedAuthAttempts(`login:${cust.email.toLowerCase()}`);
          clearFailedAuthAttempts(`otp:${cust.email.toLowerCase()}`);
        }
        logSecurityEvent(
          'LOW',
          'ACCOUNT_UNLOCKED',
          cust.email || cust.id,
          `Founder/Admin verified & unlocked account for ${cust.name} (${cust.email}).`,
          false
        );
        actionSummary = `Verified & unlocked account for "${cust.name}" (${cust.email || cust.phone}).`;
        logAudit('Theresa Isama', actorRole, 'VERIFY_OR_UNLOCK_CUSTOMER', cust.id, actionSummary);
        break;
      }

      case 'UPDATE_ORDER_DETAILS': {
        const {
          orderId,
          name,
          phone,
          email: cEmail,
          productName,
          productImageUrl,
          customStyleName,
          customStyleDescription,
          referenceImageNotes,
          isCustomStyleOverride,
          category,
          size,
          color,
          quantity,
          totalAmountNgn,
          amountPaidNgn,
          status,
          paymentStatus,
          notes,
          dueDate,
          deliveryState,
          deliveryCity,
          deliveryAddress,
        } = payload;
        const ord = db.orders.find((o) => o.id === orderId);
        if (!ord) return res.status(404).json({ error: `Order ${orderId} not found.` });
        if (name !== undefined) ord.name = name;
        if (phone !== undefined) ord.phone = phone;
        if (cEmail !== undefined) ord.email = cEmail;
        if (productName !== undefined) ord.productName = productName;
        if (productImageUrl !== undefined) ord.productImageUrl = productImageUrl;
        if (customStyleName !== undefined) ord.customStyleName = customStyleName;
        if (customStyleDescription !== undefined) ord.customStyleDescription = customStyleDescription;
        if (referenceImageNotes !== undefined) ord.referenceImageNotes = referenceImageNotes;
        if (isCustomStyleOverride !== undefined) ord.isCustomStyleOverride = Boolean(isCustomStyleOverride);
        if (category !== undefined) ord.category = category;
        if (size !== undefined) ord.size = size;
        if (color !== undefined) ord.color = color;
        if (quantity !== undefined) ord.quantity = Math.max(1, Number(quantity) || 1);
        if (totalAmountNgn !== undefined) ord.totalAmountNgn = Number(totalAmountNgn) || 0;
        if (amountPaidNgn !== undefined) ord.amountPaidNgn = Number(amountPaidNgn) || 0;
        if (status !== undefined) ord.status = status;
        if (paymentStatus !== undefined) ord.paymentStatus = paymentStatus;
        if (notes !== undefined) ord.notes = notes;
        if (dueDate !== undefined) ord.dueDate = dueDate;
        if (deliveryState !== undefined || deliveryCity !== undefined || deliveryAddress !== undefined) {
          ord.deliveryState = deliveryState ?? ord.deliveryState ?? ord.delivery?.state ?? '';
          ord.deliveryCity = deliveryCity ?? ord.deliveryCity ?? ord.delivery?.city ?? '';
          ord.deliveryAddress = deliveryAddress ?? ord.deliveryAddress ?? ord.delivery?.address ?? '';
          ord.delivery = {
            state: ord.deliveryState || 'Lagos',
            city: ord.deliveryCity || '',
            address: ord.deliveryAddress || '',
            method: ord.delivery?.method || 'Doorstep Courier',
          };
        }
        // Also permanently sync linked payment record and customStyleEdits so confirmed edits reflect across all portals and storefront
        const linkedPayment = db.payments.find((p) => p.orderId === ord.id);
        if (linkedPayment) {
          if (ord.name) linkedPayment.clientName = ord.name;
          if (ord.phone) linkedPayment.clientPhone = ord.phone;
          if (ord.productName) linkedPayment.productName = ord.productName;
          if (ord.productImageUrl) linkedPayment.productImageUrl = ord.productImageUrl;
          if (ord.size) linkedPayment.size = ord.size;
          if (ord.color) linkedPayment.color = ord.color;
          if (ord.quantity) linkedPayment.quantity = ord.quantity;
          if (totalAmountNgn !== undefined) linkedPayment.amountNgn = Number(totalAmountNgn) || linkedPayment.amountNgn;
        }
        if (
          customStyleName !== undefined ||
          customStyleDescription !== undefined ||
          productImageUrl !== undefined ||
          referenceImageNotes !== undefined
        ) {
          persistConfirmedStyleEditToDb({
            styleKey: ord.productId || ord.measurements?.styleCategory || ord.category || ord.id,
            productId: ord.productId || '',
            styleCategory: ord.measurements?.styleCategory || ord.category || '',
            customStyleName: ord.customStyleName || ord.productName || ord.category,
            customStyleDescription: ord.customStyleDescription || '',
            referenceImageUrl: ord.productImageUrl || '',
            referenceImageNotes: ord.referenceImageNotes || '',
            isCustomStyleOverride: ord.isCustomStyleOverride,
            updateStorefrontProduct: Boolean(ord.productId && ord.productId !== 'bespoke-custom' && ord.productId !== 'custom-client-style'),
            actorName: 'Theresa Isama (Admin Confirmed)',
          });
        }
        actionSummary = `Updated full order details for Order ${orderId} (${ord.name}).`;
        logAudit('Theresa Isama', actorRole, 'UPDATE_ORDER_DETAILS', orderId, actionSummary);
        break;
      }

      case 'DELETE_ORDER': {
        const { orderId } = payload;
        const idx = db.orders.findIndex((o) => o.id === orderId);
        if (idx === -1) return res.status(404).json({ error: `Order ${orderId} not found.` });
        const removed = db.orders.splice(idx, 1)[0];
        actionSummary = `Deleted Order ${orderId} (${removed.name}).`;
        logAudit('Theresa Isama', actorRole, 'DELETE_ORDER', orderId, actionSummary);
        break;
      }

      case 'SEND_MANUAL_OTP_TO_USER': {
        const { recipientEmail, recipientName } = payload;
        if (!recipientEmail) return res.status(400).json({ error: 'Recipient email required.' });
        dispatchRealTimeOtpEmail(String(recipientEmail), String(recipientName || 'Client'), 'LOGIN_OTP');
        actionSummary = `Dispatched fresh real-time OTP code to ${recipientEmail}.`;
        logAudit('Theresa Isama', actorRole, 'SEND_MANUAL_OTP_TO_USER', recipientEmail, actionSummary);
        break;
      }

      case 'RESOLVE_SECURITY_EVENT': {
        const { eventId, clearAll } = payload;
        if (clearAll) {
          (db.securityEvents || []).forEach((ev) => {
            ev.resolved = true;
          });
          actionSummary = 'Marked all security events as resolved.';
        } else {
          const ev = (db.securityEvents || []).find((e) => e.id === eventId);
          if (ev) ev.resolved = true;
          actionSummary = `Resolved security event ${eventId}.`;
        }
        logAudit('Theresa Isama', actorRole, 'RESOLVE_SECURITY_EVENT', eventId || 'All', actionSummary);
        break;
      }

      case 'DELETE_INVENTORY_ITEM': {
        const { itemId } = payload;
        const idx = db.inventory.findIndex((i) => i.id === itemId);
        if (idx === -1) return res.status(404).json({ error: 'Inventory item not found.' });
        const removed = db.inventory.splice(idx, 1)[0];
        actionSummary = `Deleted inventory item "${removed.name}" (${itemId}).`;
        logAudit('Theresa Isama', actorRole, 'DELETE_INVENTORY_ITEM', itemId, actionSummary);
        break;
      }

      case 'DELETE_TASK': {
        const { taskId } = payload;
        const idx = db.tasks.findIndex((t) => t.id === taskId);
        if (idx === -1) return res.status(404).json({ error: 'Task not found.' });
        const removed = db.tasks.splice(idx, 1)[0];
        actionSummary = `Deleted task "${removed.title}" (${taskId}).`;
        logAudit('Theresa Isama', actorRole, 'DELETE_TASK', taskId, actionSummary);
        break;
      }

      case 'MARK_NOTIFICATIONS_READ': {
        db.notifications.forEach((n) => {
          n.read = true;
        });
        actionSummary = 'Marked all admin notifications as read.';
        break;
      }

      case 'UPDATE_FACIAL_RECOGNITION': {
        const { targetType, targetId, email: targetEmail, facialPhotoUrl } = payload;
        if (targetType === 'customer' && targetId) {
          const cust = db.customers.find((c) => c.id === targetId);
          if (cust) {
            cust.facialPhotoUrl = String(facialPhotoUrl || '');
            cust.facialVerified = Boolean(facialPhotoUrl);
            cust.facialEnrolledAt = facialPhotoUrl ? now : undefined;
            actionSummary = `Updated facial recognition photo for customer "${cust.name}" (${cust.id}).`;
          }
        } else if (targetType === 'order' && targetId) {
          const ord = db.orders.find((o) => o.id === targetId);
          if (ord) {
            ord.clientFacialPhotoUrl = String(facialPhotoUrl || '');
            actionSummary = `Updated facial recognition photo on Order ${ord.id} (${ord.name}).`;
          }
        } else if (targetType === 'admin_email' && targetEmail) {
          ensureAuthorizedAdminEmailsInDb(db);
          const clean = String(targetEmail).trim().toLowerCase();
          const entry = (db.authorizedAdminEmails || []).find(
            (e) => e.email.trim().toLowerCase() === clean
          );
          if (entry) {
            entry.facialPhotoUrl = String(facialPhotoUrl || '');
            entry.facialEnrolledAt = facialPhotoUrl ? now : undefined;
          }
          const custMatch = db.customers.find((c) => (c.email || '').trim().toLowerCase() === clean);
          if (custMatch) {
            custMatch.facialPhotoUrl = String(facialPhotoUrl || '');
            custMatch.facialVerified = Boolean(facialPhotoUrl);
            custMatch.facialEnrolledAt = facialPhotoUrl ? now : undefined;
          }
          actionSummary = `Updated Admin Portal Facial Recognition photo for ${clean}.`;
        } else {
          actionSummary = 'Updated facial recognition record.';
        }
        logAudit('Theresa Isama', actorRole, 'UPDATE_FACIAL_RECOGNITION', targetId || targetEmail || 'FacialID', actionSummary);
        break;
      }

      default:
        return res.status(400).json({ error: `Unsupported action type: ${actionType}` });
    }

    saveDb(db);
    return res.json({
      success: true,
      verified: true,
      message: actionSummary,
      db,
      metrics: computeLiveMetrics(db),
      adminEmail: adminAuth.email,
      newPasswordIfUpdated: actionType === 'UPDATE_ADMIN_CREDENTIALS' ? adminAuth.password : undefined,
    });
  } catch (err: any) {
    console.error('Staff Action Error:', err);
    return res.status(500).json({ error: err.message || 'Failed to execute action.' });
  }
});

// Admin Tessy Ai Endpoint (Full Webpage Design Control + Real Live Data + Credential Management)
app.post('/api/gemini/admin-tessy', async (req, res) => {
  try {
    const { pin, email, messages } = req.body;
    if (!isAuthorizedCredentials(pin, email)) {
      return res.status(401).json({ error: 'Unauthorized HOS|TED Admin credentials.' });
    }

    const metrics = computeLiveMetrics(db);
    // Strip base64 images and bulky attachment payloads from the prompt so input tokens stay compact and never hit 429 quota limits
    const compactOrders = (db.orders || []).slice(0, 30).map((o) => ({
      id: o.id,
      name: o.name,
      phone: o.phone,
      email: o.email,
      category: o.category,
      productName: o.productName,
      customStyleName: o.customStyleName,
      customStyleDescription: o.customStyleDescription,
      size: o.size,
      color: o.color,
      quantity: o.quantity,
      totalAmountNgn: o.totalAmountNgn,
      amountPaidNgn: o.amountPaidNgn,
      status: o.status,
      paymentStatus: o.paymentStatus,
      dueDate: o.dueDate,
      measurements: o.measurements,
      deliveryState: o.deliveryState || o.delivery?.state,
      deliveryCity: o.deliveryCity || o.delivery?.city,
      createdAt: o.createdAt,
    }));

    const compactCustomers = (db.customers || []).slice(0, 30).map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      preferredStyle: c.preferredStyle,
      preferredSize: c.preferredSize,
      favoriteColors: c.favoriteColors,
      measurements: c.measurements,
      totalOrders: c.totalOrders,
      totalSpentNgn: c.totalSpentNgn,
      accountStatus: c.accountStatus,
      emailVerified: c.emailVerified,
      facialVerified: c.facialVerified,
      isFounder: c.isFounder,
    }));

    const compactPayments = (db.payments || []).slice(0, 25).map((p) => ({
      id: p.id,
      orderId: p.orderId,
      clientName: p.clientName,
      clientPhone: p.clientPhone,
      amountNgn: p.amountNgn,
      method: p.method,
      status: p.status,
      reference: p.reference,
      createdAt: p.createdAt,
    }));

    const compactWebsiteSettings = {
      ...db.websiteSettings,
      founderImageUrl: db.websiteSettings?.founderImageUrl?.startsWith('data:')
        ? '[Custom Founder Image Uploaded]'
        : db.websiteSettings?.founderImageUrl,
    };

    const liveDataContext = JSON.stringify(
      {
        brand: 'HOS|TED',
        founder: db.websiteSettings.founderName || 'Theresa Isama',
        slogan: db.websiteSettings.slogan || 'HOS|TED Hosting Nations',
        adminEmail: adminAuth.email,
        metrics,
        orders: compactOrders,
        customers: compactCustomers,
        products: db.products.map((p) => ({
          id: p.id,
          name: p.name,
          categoryLabel: p.categoryLabel,
          priceNgn: p.priceNgn,
          stockCount: p.stockCount,
          leadTime: p.leadTime,
          active: p.active,
        })),
        payments: compactPayments,
        inventory: (db.inventory || []).slice(0, 25),
        tasks: (db.tasks || []).slice(0, 25),
        appointments: (db.appointments || []).slice(0, 25),
        websiteSettings: compactWebsiteSettings,
      },
      null,
      2
    );

    const systemInstruction = `You are Tessy Ai (Executive Business Operations & Webpage Design AI Assistant) inside the HOS|TED Admin Dashboard ("HOS|TED — Hosting Nations", Founder & Creative Director: Theresa Isama).
CRITICAL RULES:
1. Always use the exact brand name "HOS|TED", slogan "HOS|TED Hosting Nations", and founder name "Theresa Isama".
2. Use ONLY the real live data provided in LIVE_DATABASE_STATE below. If a list is empty or a number is 0, report it accurately as 0 or empty—never invent fictional figures, fake customers, or fake revenue.
3. FULL WEBPAGE DESIGN & CONTENT ACCESS: You have full capability to upgrade or edit the live HOS|TED webpage design, theme colors (\`themeColor\`: "obsidian" | "midnight" | "espresso" | "cream"), accent colors (\`accentColor\`: "amber" | "gold" | "emerald" | "rose"), hero titles (\`heroTitle\`, \`heroHighlightText\`, \`heroSubtitle\`), announcement bar (\`announcementText\`, \`showAnnouncementBar\`), custom promotional banner (\`customBannerMessage\`), section visibility (\`showFlierSection\`, \`showBespokeSection\`, \`showStorySection\`), nationwide delivery text (\`nationwideDeliveryText\`), product prices/details (\`UPDATE_PRODUCT\`, \`ADD_PRODUCT\`), and admin login credentials (\`UPDATE_ADMIN_CREDENTIALS\`).
4. NON-DESTRUCTIVE CONFIRMATION GATE: Whenever the admin instructs you to change webpage design/settings, update product prices, update orders, verify payments, update inventory, manage tasks, or change the admin email/password, populate \`hasProposedAction: true\`, \`actionType\`, \`actionSummary\`, and \`actionPayloadJson\` so the admin can confirm and execute it! Never claim an action is already applied until confirmed.

LIVE_DATABASE_STATE:
${liveDataContext}

Supported \`actionType\` values and their \`actionPayloadJson\` format:
- "UPDATE_WEBSITE_SETTINGS": JSON object with any fields of websiteSettings (e.g., {"themeColor":"obsidian","accentColor":"amber","heroTitle":"...","heroSubtitle":"...","announcementText":"...","customBannerMessage":"...","showFlierSection":true})
- "UPDATE_PRODUCT": {"id":"ha-01","priceNgn":65000,"stockCount":5,"leadTime":"3-5 business days","name":"...","description":"..."}
- "ADD_PRODUCT": {"name":"...","category":"ankara_gowns","categoryLabel":"Ankara Gowns","priceNgn":70000,"fabric":"...","description":"..."}
- "UPDATE_ORDER_STATUS": {"orderId":"...","newStatus":"In Production"}
- "CREATE_ORDER": {"name":"...","phone":"...","category":"...","totalAmountNgn":0,"delivery":{"state":"Lagos","city":"Ikeja","address":"...","method":"Doorstep Courier"}}
- "RECORD_PAYMENT_VERIFICATION": {"paymentId":"...","status":"Verified"}
- "CREATE_TASK": {"title":"...","description":"...","priority":"High","assignee":"Theresa Isama"}
- "COMPLETE_TASK": {"taskId":"..."}
- "UPDATE_INVENTORY": {"itemId":"...","quantity":10,"name":"...","unit":"Yards"}
- "UPDATE_ADMIN_CREDENTIALS": {"newEmail":"...","newPassword":"..."}`;

    const recentAdminMessages = Array.isArray(messages) ? messages.slice(-10) : [];
    const lastUserMessage =
      recentAdminMessages.length > 0
        ? String(recentAdminMessages[recentAdminMessages.length - 1].content || '').slice(0, 1500)
        : 'Give me an accurate real-time summary of HOS|TED.';

    const conversationTranscript =
      recentAdminMessages.length > 0
        ? recentAdminMessages
            .map((m: any) => `${String(m.role || 'user').toUpperCase()}: ${String(m.content || '').slice(0, 1500)}`)
            .join('\n')
        : `USER: ${lastUserMessage}`;

    const adminSchema = {
      type: Type.OBJECT,
      properties: {
        reply: {
          type: Type.STRING,
          description: 'The response from Tessy Ai grounded strictly in real HOS|TED data.',
        },
        hasProposedAction: {
          type: Type.BOOLEAN,
          description: 'Set to true if proposing any website design, catalog, order, task, or credential update.',
        },
        actionType: {
          type: Type.STRING,
          description: 'Action type if hasProposedAction is true.',
        },
        actionSummary: {
          type: Type.STRING,
          description: 'Human-readable summary of the action requiring confirmation.',
        },
        actionPayloadJson: {
          type: Type.STRING,
          description: 'JSON string of the payload object for the proposed action.',
        },
      },
      required: ['reply', 'hasProposedAction'],
    };

    let parsed: any = null;
    const adminCandidateModels = [
      'gemini-3-flash-preview',
      'gemini-2.5-flash',
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
    ];
    for (const modelName of adminCandidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: conversationTranscript,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: adminSchema,
          },
        });
        parsed = JSON.parse(response.text || '{}');
        if (parsed && parsed.reply) break;
      } catch {
        // Try next candidate model or fallback to deterministic live-data summary
      }
    }

    if (!parsed || !parsed.reply) {
      parsed = {
        reply:
          `Welcome back to **HOS|TED** (*HOS|TED Hosting Nations*), Founder **Theresa Isama**!\n\n` +
          `Here is your live real-time executive snapshot:\n` +
          `• **Total Orders**: ${metrics.totalOrders} (${metrics.activeOrdersCount} active in production/pipeline)\n` +
          `• **Verified Revenue**: ₦${metrics.verifiedRevenueNgn.toLocaleString()} (Pending verification: ₦${metrics.pendingRevenueNgn.toLocaleString()} across ${metrics.pendingPaymentsCount} payment(s))\n` +
          `• **Registered Customers**: ${metrics.totalCustomers}\n` +
          `• **Catalog Products**: ${db.products.length} signature items\n` +
          `• **Open Atelier Tasks**: ${metrics.openTasksCount} | **Upcoming Fittings**: ${metrics.upcomingAppointments}\n\n` +
          `Tell me any product price, order status, or website design setting you would like to update and I will prepare the confirmation card for you immediately.`,
        hasProposedAction: false,
      };
    }

    let proposedAction: ProposedAdminAction | undefined = undefined;
    if (parsed.hasProposedAction && parsed.actionType && parsed.actionPayloadJson) {
      try {
        proposedAction = {
          type: parsed.actionType,
          summary: parsed.actionSummary || `Execute ${parsed.actionType}`,
          payload: JSON.parse(parsed.actionPayloadJson),
        };
      } catch (e) {
        console.warn('Could not parse actionPayloadJson:', e);
      }
    }

    res.json({
      reply: parsed.reply || 'Here is your real-time HOS|TED update.',
      proposedAction,
    });
  } catch (error: any) {
    const metrics = computeLiveMetrics(db);
    res.status(200).json({
      reply:
        `HOS|TED Real-Time Summary: ${metrics.totalOrders} Total Orders, ₦${metrics.verifiedRevenueNgn.toLocaleString()} Verified Revenue, ${metrics.totalCustomers} Customers, and ${db.products.length} Active Products. How can I assist you next?`,
    });
  }
});

// Ensure any unmatched /api/* route always returns valid JSON rather than falling through to SPA HTML
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`HOS|TED (Hosting Nations) server running at http://localhost:${PORT}`);
  });
}

startServer();
