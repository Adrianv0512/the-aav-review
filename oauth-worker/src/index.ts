interface Env {
  CMS_ORIGIN: string;
  CMS_SITE_DOMAIN: string;
  GITHUB_OAUTH_ID: string;
  GITHUB_OAUTH_SECRET: string;
  GITHUB_REPO_PRIVATE?: string;
}

const STATE_COOKIE = "decap_oauth_state";
const STATE_MAX_AGE_SECONDS = 10 * 60;

function randomToken(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return btoa(String.fromCharCode(...buffer))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function cookieValue(request: Request, name: string): string | undefined {
  const cookies = request.headers.get("Cookie")?.split(";") ?? [];
  for (const cookie of cookies) {
    const [key, ...value] = cookie.trim().split("=");
    if (key === name) return value.join("=");
  }
  return undefined;
}

function stateCookie(value: string, maxAge: number): string {
  return `${STATE_COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/callback; Max-Age=${maxAge}`;
}

function textResponse(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function handleAuth(request: Request, env: Env): Response {
  const url = new URL(request.url);
  if (url.searchParams.get("provider") !== "github") {
    return textResponse("Invalid OAuth provider.", 400);
  }

  if (url.searchParams.get("site_id") !== env.CMS_SITE_DOMAIN) {
    return textResponse("Invalid CMS site.", 403);
  }

  const state = randomToken();
  const callbackUrl = `${url.origin}/callback`;
  const scope = env.GITHUB_REPO_PRIVATE === "1" ? "repo" : "public_repo";
  const authorizationUrl = new URL("https://github.com/login/oauth/authorize");
  authorizationUrl.search = new URLSearchParams({
    client_id: env.GITHUB_OAUTH_ID,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope,
    state,
  }).toString();

  return new Response(null, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      Location: authorizationUrl.toString(),
      "Referrer-Policy": "no-referrer",
      "Set-Cookie": stateCookie(state, STATE_MAX_AGE_SECONDS),
    },
  });
}

async function exchangeCode(
  code: string,
  callbackUrl: string,
  env: Env,
): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "the-ascent-report-cms-auth",
    },
    body: JSON.stringify({
      client_id: env.GITHUB_OAUTH_ID,
      client_secret: env.GITHUB_OAUTH_SECRET,
      code,
      redirect_uri: callbackUrl,
    }),
  });

  const result = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !result.access_token) {
    throw new Error(result.error_description || result.error || "GitHub token exchange failed.");
  }
  return result.access_token;
}

function callbackResponse(token: string, env: Env): Response {
  const nonce = randomToken(18);
  const cmsOrigin = JSON.stringify(env.CMS_ORIGIN).replaceAll("<", "\\u003c");
  const payload = JSON.stringify({ token }).replaceAll("<", "\\u003c");
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Authorizing The Ascent Report</title>
  </head>
  <body>
    <p>Authorizing The Ascent Report editor…</p>
    <script nonce="${nonce}">
      const cmsOrigin = ${cmsOrigin};
      const payload = ${payload};
      const receiveMessage = (event) => {
        if (event.origin !== cmsOrigin || event.source !== window.opener) return;
        window.opener.postMessage(
          "authorization:github:success:" + JSON.stringify(payload),
          cmsOrigin,
        );
        window.removeEventListener("message", receiveMessage);
      };
      window.addEventListener("message", receiveMessage);
      if (window.opener) window.opener.postMessage("authorizing:github", cmsOrigin);
    </script>
  </body>
</html>`;

  return new Response(html, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'none'; img-src 'none'; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`,
      "Content-Type": "text/html; charset=utf-8",
      "Referrer-Policy": "no-referrer",
      "Set-Cookie": stateCookie("", 0),
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function handleCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const expectedState = cookieValue(request, STATE_COOKIE);
  if (!state || !expectedState || state !== expectedState) {
    return new Response("OAuth state validation failed. Please restart login from the CMS.", {
      status: 403,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
        "Referrer-Policy": "no-referrer",
        "Set-Cookie": stateCookie("", 0),
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const githubError = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (githubError) return textResponse(`GitHub authorization failed: ${githubError}`, 400);

  const code = url.searchParams.get("code");
  if (!code) return textResponse("GitHub did not return an authorization code.", 400);

  try {
    const token = await exchangeCode(code, `${url.origin}/callback`, env);
    return callbackResponse(token, env);
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub token exchange failed.";
    return textResponse(message, 502);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "GET") return textResponse("Method not allowed.", 405);

    const pathname = new URL(request.url).pathname;
    if (pathname === "/auth") return handleAuth(request, env);
    if (pathname === "/callback") return handleCallback(request, env);
    if (pathname === "/") return textResponse("The Ascent Report CMS OAuth proxy is running.", 200);
    return textResponse("Not found.", 404);
  },
} satisfies ExportedHandler<Env>;
