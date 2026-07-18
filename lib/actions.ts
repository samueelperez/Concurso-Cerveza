"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireAdmin } from "./auth";
import {
  ADMIN_COOKIE,
  ADMIN_PASSWORD,
  ADMIN_TOKEN,
  MAX_SCORE,
  MIN_SCORE,
} from "./constants";
import { ensureSchema, sql } from "./db";
import type { ActionResult, ContestStatus } from "./types";

function fail(error: string): ActionResult {
  return { ok: false, error };
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function castVote(
  participantId: number,
  beerId: number,
  score: number
): Promise<ActionResult> {
  try {
    await ensureSchema();
    const halfSteps = score * 2;
    if (
      !Number.isFinite(score) ||
      score < MIN_SCORE ||
      score > MAX_SCORE ||
      !Number.isInteger(halfSteps) ||
      !Number.isInteger(participantId) ||
      !Number.isInteger(beerId)
    ) {
      return fail("Voto no válido.");
    }

    const q = sql();
    const [contest] = await q`SELECT status FROM contest WHERE id = 1`;
    if (contest?.status !== "voting") {
      return fail("La votación está cerrada. ¡Ya no se puede votar!");
    }

    const rows = await q`
      INSERT INTO votes (participant_id, beer_id, score)
      VALUES (${participantId}, ${beerId}, ${score})
      ON CONFLICT (participant_id, beer_id)
      DO UPDATE SET score = EXCLUDED.score, updated_at = now()
      RETURNING id`;
    if (rows.length === 0) return fail("No se pudo registrar el voto.");

    refresh();
    return { ok: true };
  } catch {
    return fail("Error al guardar el voto. Inténtalo de nuevo.");
  }
}

export async function loginAdmin(password: string): Promise<ActionResult> {
  if (password !== ADMIN_PASSWORD) {
    return fail("Contraseña incorrecta.");
  }
  const store = await cookies();
  store.set(ADMIN_COOKIE, ADMIN_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  refresh();
  return { ok: true };
}

export async function logoutAdmin(): Promise<ActionResult> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  refresh();
  return { ok: true };
}

export async function setContestStatus(status: ContestStatus): Promise<ActionResult> {
  try {
    await requireAdmin();
    await ensureSchema();
    if (!["voting", "locked", "finished"].includes(status)) {
      return fail("Estado no válido.");
    }
    await sql()`UPDATE contest SET status = ${status} WHERE id = 1`;
    refresh();
    return { ok: true };
  } catch {
    return fail("No se pudo cambiar el estado.");
  }
}

export async function addBeer(number: number, realName: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await ensureSchema();
    if (!Number.isInteger(number) || number < 1 || number > 999) {
      return fail("El número debe estar entre 1 y 999.");
    }
    await sql()`INSERT INTO beers (number, real_name) VALUES (${number}, ${realName.trim()})`;
    refresh();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message.includes("beers_number_key")) {
      return fail(`Ya existe una cerveza con el número ${number}.`);
    }
    return fail("No se pudo añadir la cerveza.");
  }
}

export async function updateBeerName(id: number, realName: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await ensureSchema();
    await sql()`UPDATE beers SET real_name = ${realName.trim()} WHERE id = ${id}`;
    refresh();
    return { ok: true };
  } catch {
    return fail("No se pudo guardar el nombre.");
  }
}

export async function updateBeerGroup(
  id: number,
  groupId: number | null
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await ensureSchema();
    await sql()`UPDATE beers SET group_id = ${groupId} WHERE id = ${id}`;
    refresh();
    return { ok: true };
  } catch {
    return fail("No se pudo vincular la pareja.");
  }
}

export async function addGroup(name: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await ensureSchema();
    const trimmed = name.trim();
    if (!trimmed) return fail("El nombre no puede estar vacío.");
    await sql()`INSERT INTO groups (name) VALUES (${trimmed})`;
    refresh();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message.includes("groups_name_key")) {
      return fail("Esa pareja ya existe.");
    }
    return fail("No se pudo añadir la pareja.");
  }
}

export async function deleteGroup(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    await ensureSchema();
    await sql()`DELETE FROM groups WHERE id = ${id}`;
    refresh();
    return { ok: true };
  } catch {
    return fail("No se pudo eliminar la pareja.");
  }
}

export async function deleteBeer(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    await ensureSchema();
    await sql()`DELETE FROM beers WHERE id = ${id}`;
    refresh();
    return { ok: true };
  } catch {
    return fail("No se pudo eliminar la cerveza.");
  }
}

export async function addParticipant(name: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await ensureSchema();
    const trimmed = name.trim();
    if (!trimmed) return fail("El nombre no puede estar vacío.");
    await sql()`INSERT INTO participants (name) VALUES (${trimmed})`;
    refresh();
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.message.includes("participants_name_key")) {
      return fail("Ese nombre ya existe.");
    }
    return fail("No se pudo añadir el participante.");
  }
}

export async function deleteParticipant(id: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    await ensureSchema();
    await sql()`DELETE FROM participants WHERE id = ${id}`;
    refresh();
    return { ok: true };
  } catch {
    return fail("No se pudo eliminar el participante.");
  }
}
