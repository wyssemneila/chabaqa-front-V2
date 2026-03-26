import { NextRequest, NextResponse } from "next/server"
import { SignJWT } from "jose"

const LOCAL_DEV_SECRET = "local-dev-jwt-secret-change-me"

const DEMO_USERS: Record<string, { _id: string; name: string; email: string; role: string; username: string }> = {
  learner: { _id: "demo-learner", name: "Demo Learner", email: "demo.learner@chabaqa.io", role: "user",    username: "demo_learner" },
  creator: { _id: "demo-creator", name: "Demo Creator", email: "demo.creator@chabaqa.io", role: "creator", username: "demo_creator" },
  admin:   { _id: "demo-admin",   name: "Demo Admin",   email: "demo.admin@chabaqa.io",   role: "admin",   username: "demo_admin"   },
}

export async function GET(req: NextRequest) {
  const role = req.nextUrl.searchParams.get("role") ?? "learner"
  const user = DEMO_USERS[role] ?? DEMO_USERS.learner

  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET?.trim() || LOCAL_DEV_SECRET
  )

  const token = await new SignJWT({
    sub:      user._id,
    email:    user.email,
    role:     user.role,
    name:     user.name,
    username: user.username,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)

  return NextResponse.json({ token, user })
}
