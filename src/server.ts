import {
  createStartHandler,
  defaultStreamHandler,
  defineHandlerCallback,
  type RequestHandlerContext,
} from "@tanstack/react-start/server";
import { createServerEntry } from "@tanstack/react-start/server-entry";
import { getFirestore } from "@/lib/firestore-server";
import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

const JWT_SECRET = process.env.DAYLOG_JWT_SECRET || "";

type RegisterBody = {
  phone?: unknown;
  pin?: unknown;
  otp?: unknown;
};

type LoginBody = {
  phone?: unknown;
  pin?: unknown;
};

type PutDataBody = {
  clientUpdatedAtMs?: unknown;
  data?: unknown;
};

type UserDoc = {
  pinSalt: string;
  pinHash: string;
  createdAtMs: number;
  updatedAtMs: number;
};

type DataDoc = {
  data: unknown;
  updatedAtMs: number;
};

function jsonResponse(body: Json, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init?.headers ?? {}),
    },
  });
}

function normalizePhone(input: unknown): string {
  const digits = String(input ?? "")
    .replace(/\D/g, "")
    .slice(0, 10);
  return digits.length === 10 ? digits : "";
}

function hashPin(pin: string, saltHex: string): string {
  // SHA-256(salt || pin). For this app's simple PIN use-case, this is adequate
  // when paired with rate limiting (which should be added later).
  const h = createHash("sha256");
  h.update(Buffer.from(saltHex, "hex"));
  h.update(pin);
  return h.digest("hex");
}

function safeEqHex(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

async function signToken(phone: string) {
  if (!JWT_SECRET) throw new Error("Missing DAYLOG_JWT_SECRET");
  const secret = new TextEncoder().encode(JWT_SECRET);
  return await new SignJWT({ phone })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(phone)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

async function verifyToken(req: Request): Promise<string | null> {
  if (!JWT_SECRET) return null;
  const auth = req.headers.get("authorization") ?? "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m?.[1]) return null;
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(m[1], secret);
    const phone = normalizePhone(payload.phone ?? payload.sub ?? "");
    return phone || null;
  } catch {
    return null;
  }
}

async function readJson(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function handleApi(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);

    // Health
    if (url.pathname === "/api/health") {
      return jsonResponse({ ok: true });
    }

    // Auth: exists
    if (url.pathname === "/api/auth/exists" && req.method === "GET") {
      const phone = normalizePhone(url.searchParams.get("phone"));
      if (!phone) return jsonResponse({ exists: false }, { status: 200 });
      const firestore = await getFirestore();
      const snap = await firestore.collection("daylogUsers").doc(phone).get();
      return jsonResponse({ exists: snap.exists }, { status: 200 });
    }

    // Auth: register
    if (url.pathname === "/api/auth/register" && req.method === "POST") {
      const body = (await readJson(req)) as RegisterBody | null;
      const phone = normalizePhone(body?.phone);
      const pin = String(body?.pin ?? "").trim();
      const otp = String(body?.otp ?? "").trim();

      if (!JWT_SECRET) return jsonResponse({ error: "Cloud sync not configured" }, { status: 503 });
      if (!phone) return jsonResponse({ error: "Invalid phone" }, { status: 400 });
      if (pin.length < 4) return jsonResponse({ error: "Invalid pin" }, { status: 400 });
      if (otp !== "1234") return jsonResponse({ error: "Invalid otp" }, { status: 401 });

      const firestore = await getFirestore();
      const userRef = firestore.collection("daylogUsers").doc(phone);
      const existing = await userRef.get();
      if (existing.exists) {
        // Already registered: treat as login for convenience
        const token = await signToken(phone);
        return jsonResponse({ token }, { status: 200 });
      }

      const salt = randomBytes(16).toString("hex");
      const pinHash = hashPin(pin, salt);
      const now = Date.now();
      await userRef.set({ pinSalt: salt, pinHash, createdAtMs: now, updatedAtMs: now });

      const token = await signToken(phone);
      return jsonResponse({ token }, { status: 200 });
    }

    // Auth: login
    if (url.pathname === "/api/auth/login" && req.method === "POST") {
      const body = (await readJson(req)) as LoginBody | null | undefined;
      const phone = normalizePhone(body?.phone);
      const pin = String(body?.pin ?? "").trim();

      if (!JWT_SECRET) return jsonResponse({ error: "Cloud sync not configured" }, { status: 503 });
      if (!phone) return jsonResponse({ error: "Invalid phone" }, { status: 400 });
      if (pin.length < 4) return jsonResponse({ error: "Invalid pin" }, { status: 400 });

      const firestore = await getFirestore();
      const userRef = firestore.collection("daylogUsers").doc(phone);
      const snap = await userRef.get();
      if (!snap.exists) return jsonResponse({ error: "Not found" }, { status: 404 });
      const data = (snap.data() ?? {}) as Partial<UserDoc>;
      const salt = String(data.pinSalt ?? "");
      const expected = String(data.pinHash ?? "");
      const actual = hashPin(pin, salt);
      if (!salt || !expected || !safeEqHex(actual, expected)) {
        return jsonResponse({ error: "Wrong pin" }, { status: 401 });
      }
      const token = await signToken(phone);
      return jsonResponse({ token }, { status: 200 });
    }

    // Data: get/push
    if (url.pathname === "/api/data") {
      const phone = await verifyToken(req);
      if (!phone) return jsonResponse({ error: "Unauthorized" }, { status: 401 });

      const firestore = await getFirestore();
      const docRef = firestore.collection("daylogData").doc(phone);

      if (req.method === "GET") {
        const snap = await docRef.get();
        if (!snap.exists) return jsonResponse({ error: "Not found" }, { status: 404 });
        const data = (snap.data() ?? {}) as Partial<DataDoc>;
        return jsonResponse(
          {
            data: data.data ?? { entries: [], presets: [], customFields: [] },
            updatedAtMs: Number(data.updatedAtMs ?? 0),
          },
          { status: 200 },
        );
      }

      if (req.method === "PUT") {
        const body = (await readJson(req)) as PutDataBody | null;
        const incomingUpdatedAtMs = Number(body?.clientUpdatedAtMs ?? 0);
        const incoming = body?.data;
        if (!incoming || typeof incoming !== "object") {
          return jsonResponse({ error: "Invalid payload" }, { status: 400 });
        }
        const now = Date.now();
        const snap = await docRef.get();
        const currentUpdatedAtMs = snap.exists
          ? Number(((snap.data() ?? {}) as Partial<DataDoc>).updatedAtMs ?? 0)
          : 0;
        const nextUpdatedAtMs = Math.max(now, incomingUpdatedAtMs, currentUpdatedAtMs);

        await docRef.set(
          {
            data: incoming,
            updatedAtMs: nextUpdatedAtMs,
          },
          { merge: true },
        );

        return jsonResponse({ updatedAtMs: nextUpdatedAtMs }, { status: 200 });
      }

      return jsonResponse({ error: "Method not allowed" }, { status: 405 });
    }

    return jsonResponse({ error: "Not found" }, { status: 404 });
  } catch {
    return jsonResponse({ error: "Server error" }, { status: 500 });
  }
}

const customHandler = defineHandlerCallback(async (ctx: RequestHandlerContext) => {
  const url = new URL(ctx.request.url);
  if (url.pathname.startsWith("/api/")) {
    return await handleApi(ctx.request);
  }
  return defaultStreamHandler(ctx);
});

const fetchHandler = createStartHandler(customHandler);

export default createServerEntry({
  fetch: fetchHandler,
});
