import { next } from "@vercel/functions";

const AUTH_COOKIE = "site_auth";
const AUTH_PATH = "/__auth";
const AUTH_MAX_AGE = 60 * 60 * 24 * 7;

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseCookies(header) {
  const cookies = new Map();

  if (!header) {
    return cookies;
  }

  for (const part of header.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");

    if (!name) {
      continue;
    }

    cookies.set(name, valueParts.join("="));
  }

  return cookies;
}

function safeEquals(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

function normalizeNextPath(value) {
  if (!value || typeof value !== "string") {
    return "/";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  if (value.startsWith(AUTH_PATH)) {
    return "/";
  }

  return value;
}

function isSecureRequest(request) {
  return (
    new URL(request.url).protocol === "https:" ||
    request.headers.get("x-forwarded-proto") === "https"
  );
}

function renderLoginPage({ nextPath, invalid }) {
  const action = `${AUTH_PATH}?next=${encodeURIComponent(nextPath)}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Protected Demo</title>
    <style>
      :root {
        color-scheme: dark;
        font-family: "Avenir Next", "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #0c0c0f;
        color: #f3f3f5;
        padding: 1.5rem;
      }

      main {
        width: min(100%, 22rem);
        display: grid;
        gap: 1rem;
      }

      form {
        display: grid;
        gap: 0.85rem;
      }

      input {
        width: 100%;
        border: 1px solid #303038;
        border-radius: 999px;
        background: #17171c;
        color: inherit;
        padding: 0.9rem 1rem;
        font: inherit;
      }

      input:focus {
        outline: 2px solid #5f8cff;
        outline-offset: 2px;
      }

      button {
        border: 0;
        border-radius: 999px;
        background: #f3f3f5;
        color: #0c0c0f;
        padding: 0.9rem 1rem;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
      }

      p {
        margin: 0;
        color: #aaaaaf;
        font-size: 0.95rem;
      }

      .error {
        color: #ff9a9a;
      }
    </style>
  </head>
  <body>
    <main>
      <p>Enter password to view this demo.</p>
      ${invalid ? '<p class="error">Incorrect password.</p>' : ""}
      <form method="POST" action="${escapeHtml(action)}">
        <input type="password" name="password" placeholder="Password" autofocus required />
        <button type="submit">Enter</button>
      </form>
    </main>
  </body>
</html>`;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function createCookieHeader(request, token) {
  const secure = isSecureRequest(request) ? "; Secure" : "";
  return `${AUTH_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${AUTH_MAX_AGE}${secure}`;
}

export default async function middleware(request) {
  const expectedPassword = process.env.SITE_PASSWORD;

  if (!expectedPassword || request.method === "OPTIONS") {
    return next();
  }

  const url = new URL(request.url);

  if (url.pathname.startsWith("/_vercel")) {
    return next();
  }

  const expectedToken = await sha256(expectedPassword);
  const cookies = parseCookies(request.headers.get("cookie"));
  const suppliedToken = cookies.get(AUTH_COOKIE) ?? "";
  const isAuthenticated = safeEquals(suppliedToken, expectedToken);

  if (url.pathname === AUTH_PATH) {
    const nextPath = normalizeNextPath(url.searchParams.get("next"));

    if (request.method === "POST") {
      const formData = await request.formData();
      const submittedPassword = String(formData.get("password") ?? "");

      if (safeEquals(await sha256(submittedPassword), expectedToken)) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: nextPath,
            "Set-Cookie": createCookieHeader(request, expectedToken),
            "Cache-Control": "no-store"
          }
        });
      }

      return new Response(renderLoginPage({ nextPath, invalid: true }), {
        status: 401,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store"
        }
      });
    }

    if (isAuthenticated) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: nextPath,
          "Cache-Control": "no-store"
        }
      });
    }

    return new Response(renderLoginPage({ nextPath, invalid: false }), {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  }

  if (isAuthenticated) {
    return next();
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${AUTH_PATH}?next=${encodeURIComponent(
        normalizeNextPath(`${url.pathname}${url.search}`)
      )}`,
      "Cache-Control": "no-store"
    }
  });
}
