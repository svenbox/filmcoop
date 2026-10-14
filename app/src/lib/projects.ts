import { promises as fs } from "fs";
import path from "path";

export interface Project {
  id: string;
  namn: string;
  spreadsheetId: string;
  producerEmails: string[];
  createdAt: string;
}

export interface ProjectInput {
  namn: string;
  spreadsheetId: string;
  producerEmails: string[];
}

const DATA_DIR = process.env.DATA_DIR || "/data";
const FILE = path.join(DATA_DIR, "projects.json");

// Seriekör så att två samtidiga skrivningar inte skriver över varandra.
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
}

export function parseEmails(raw: string | string[]): string[] {
  const list = Array.isArray(raw) ? raw : raw.split(/[,;\s]+/);
  return Array.from(
    new Set(list.map((e) => e.trim().toLowerCase()).filter(Boolean))
  );
}

/** Första start: skapar ett projekt från de gamla env-variablerna så att befintlig installation fortsätter fungera. */
function seedFromEnv(): Project[] {
  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!spreadsheetId) return [];
  return [
    {
      id: "main",
      namn: process.env.PROJECT_NAME || "film.coop",
      spreadsheetId,
      producerEmails: parseEmails(process.env.PRODUCER_EMAILS || ""),
      createdAt: new Date().toISOString(),
    },
  ];
}

async function readAll(): Promise<Project[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Project[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    const seeded = seedFromEnv();
    if (seeded.length > 0) await writeAll(seeded);
    return seeded;
  }
}

async function writeAll(projects: Project[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(projects, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

export function listProjects(): Promise<Project[]> {
  return serialized(readAll);
}

export async function getProject(id: string): Promise<Project | null> {
  return (await listProjects()).find((p) => p.id === id) ?? null;
}

/** Tar emot antingen ett rent ID eller en hel Google Sheets-URL. */
export function parseSpreadsheetId(input: string): string | null {
  const trimmed = input.trim();
  const fromUrl = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fromUrl) return fromUrl[1];
  return /^[a-zA-Z0-9_-]{20,}$/.test(trimmed) ? trimmed : null;
}

function slugify(namn: string): string {
  const slug = namn
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "projekt";
}

export function createProject(input: ProjectInput): Promise<Project> {
  return serialized(async () => {
    const projects = await readAll();

    const base = slugify(input.namn);
    let id = base;
    for (let n = 2; projects.some((p) => p.id === id); n++) id = `${base}-${n}`;

    const project: Project = {
      id,
      namn: input.namn.trim(),
      spreadsheetId: input.spreadsheetId,
      producerEmails: input.producerEmails,
      createdAt: new Date().toISOString(),
    };
    await writeAll([...projects, project]);
    return project;
  });
}

export function updateProject(id: string, input: ProjectInput): Promise<Project | null> {
  return serialized(async () => {
    const projects = await readAll();
    const idx = projects.findIndex((p) => p.id === id);
    if (idx === -1) return null;

    const updated: Project = {
      ...projects[idx],
      namn: input.namn.trim(),
      spreadsheetId: input.spreadsheetId,
      producerEmails: input.producerEmails,
    };
    projects[idx] = updated;
    await writeAll(projects);
    return updated;
  });
}

export function deleteProject(id: string): Promise<boolean> {
  return serialized(async () => {
    const projects = await readAll();
    const remaining = projects.filter((p) => p.id !== id);
    if (remaining.length === projects.length) return false;
    await writeAll(remaining);
    return true;
  });
}
