import "server-only";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, ADMIN_TOKEN } from "./constants";

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === ADMIN_TOKEN;
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("No autorizado");
  }
}
