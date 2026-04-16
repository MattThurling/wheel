import { next } from "@vercel/functions";

const AUTH_REALM = "Protected Demo";

function unauthorized() {
  return new Response("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${AUTH_REALM}", charset="UTF-8"`,
      "Cache-Control": "no-store"
    }
  });
}

function decodeBasicCredentials(value) {
  try {
    return atob(value);
  } catch {
    return null;
  }
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

export default function middleware(request) {
  const expectedPassword = process.env.SITE_PASSWORD;
  const expectedUsername = process.env.SITE_USERNAME;

  if (!expectedPassword || request.method === "OPTIONS") {
    return next();
  }

  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Basic ")) {
    return unauthorized();
  }

  const decodedCredentials = decodeBasicCredentials(authorization.slice(6));

  if (!decodedCredentials) {
    return unauthorized();
  }

  const separatorIndex = decodedCredentials.indexOf(":");

  if (separatorIndex === -1) {
    return unauthorized();
  }

  const suppliedUsername = decodedCredentials.slice(0, separatorIndex);
  const suppliedPassword = decodedCredentials.slice(separatorIndex + 1);

  const usernameIsValid = expectedUsername
    ? safeEquals(suppliedUsername, expectedUsername)
    : true;
  const passwordIsValid = safeEquals(suppliedPassword, expectedPassword);

  if (!usernameIsValid || !passwordIsValid) {
    return unauthorized();
  }

  return next();
}
