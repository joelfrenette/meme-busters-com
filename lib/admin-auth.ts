"use server"

import { cookies } from "next/headers"

const ADMIN_EMAIL = "truthhacker@protonmail.com"
const ADMIN_PASSWORD = "TRUTH"
const ADMIN_SESSION_COOKIE = "admin_session"

export async function loginAdmin(email: string, password: string) {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const cookieStore = await cookies()
    // Set session cookie that expires in 24 hours
    cookieStore.set(ADMIN_SESSION_COOKIE, "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    })
    return { success: true }
  }
  return { success: false, error: "Invalid credentials" }
}

export async function logoutAdmin() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_SESSION_COOKIE)
}

export async function isAdminAuthenticated() {
  const cookieStore = await cookies()
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)
  return session?.value === "authenticated"
}
