import { NextResponse } from "next/server";

/**
 * Same-origin logo proxy. Lets the client read logo pixels on a canvas
 * (for accent-color extraction) without CORS taint, and centralizes the
 * Clearbit → Google-favicon fallback.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain")?.toLowerCase() ?? "";
  if (!/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/.test(domain)) {
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });
  }

  const sources = [
    `https://logo.clearbit.com/${domain}`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const type = res.headers.get("content-type") ?? "";
      if (res.ok && type.startsWith("image/")) {
        const body = await res.arrayBuffer();
        if (body.byteLength > 0) {
          return new NextResponse(body, {
            headers: {
              "Content-Type": type,
              "Cache-Control": "public, max-age=86400, immutable",
            },
          });
        }
      }
    } catch {
      // try the next source
    }
  }

  return NextResponse.json({ error: "No logo found" }, { status: 404 });
}
