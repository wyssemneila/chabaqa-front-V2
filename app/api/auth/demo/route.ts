import { NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"

const LOCAL_DEV_SECRET = "local-dev-jwt-secret-change-me"

const DEMO_USERS: Record<string, { _id: string; name: string; email: string; role: string; username: string; redirect: string }> = {
  learner: { _id: "demo-learner", name: "Demo Learner", email: "demo.learner@chabaqa.io", role: "user",    username: "demo_learner", redirect: "/explore" },
  creator: { _id: "demo-creator", name: "Demo Creator", email: "demo.creator@chabaqa.io", role: "creator", username: "demo_creator", redirect: "/dashboard/create-community" },
  admin:   { _id: "demo-admin",   name: "Demo Admin",   email: "demo.admin@chabaqa.io",   role: "admin",   username: "demo_admin",   redirect: "/dashboard/create-community" },
}

export async function GET(req: NextRequest) {
  const role   = req.nextUrl.searchParams.get("role") ?? "learner"
  const locale = req.nextUrl.searchParams.get("locale") ?? "en"
  const demo   = DEMO_USERS[role] ?? DEMO_USERS.learner

  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET?.trim() || LOCAL_DEV_SECRET
  )

  const token = await new SignJWT({
    sub:      demo._id,
    email:    demo.email,
    role:     demo.role,
    name:     demo.name,
    username: demo.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)

  const dest = `/${locale}${demo.redirect}`
  const redirectUrl = new URL(dest, req.nextUrl.origin)

  const res = NextResponse.redirect(redirectUrl)

  const isSecure = req.nextUrl.protocol === "https:"
  const maxAge   = 7 * 24 * 60 * 60

  // Set the cookie server-side so the middleware sees it immediately
  res.cookies.set("accessToken", token, {
    path:     "/",
    maxAge,
    sameSite: "lax",
    secure:   isSecure,
    httpOnly: false, // must be readable by client JS (auth-provider reads it)
  })

  return res
}
