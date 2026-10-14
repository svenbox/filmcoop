"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import type { Project } from "@/lib/projects";

interface AdminResponse {
  projects: Project[];
  serviceAccountEmail: string;
}

interface FormState {
  namn: string;
  spreadsheet: string;
  producerEmails: string;
}

const EMPTY: FormState = { namn: "", spreadsheet: "", producerEmails: "" };

export default function AdminPage() {
  const { status } = useSession();
  const [data, setData] = useState<AdminResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch("/api/admin/projects")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Kunde inte hämta projekt"));
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/login";
    }
    if (status === "authenticated") load();
  }, [status, load]);

  if (status === "loading" || (!data && !error)) {
    return <div className="loading-state">Laddar…</div>;
  }

  if (error) {
    return (
      <div className="page">
        <div className="alert error">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setFormError(null);
    setForm({
      namn: p.namn,
      spreadsheet: p.spreadsheetId,
      producerEmails: p.producerEmails.join(", "),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormError(null);
    setForm(EMPTY);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);

    const res = await fetch(
      editingId ? `/api/admin/projects/${editingId}` : "/api/admin/projects",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }
    );
    const body = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setFormError(body.error || "Något gick fel");
      return;
    }

    cancelEdit();
    load();
  };

  const remove = async (p: Project) => {
    if (!window.confirm(`Ta bort "${p.namn}" från portalen? Kalkylbladet påverkas inte.`)) {
      return;
    }
    const res = await fetch(`/api/admin/projects/${p.id}`, { method: "DELETE" });
    if (res.ok) load();
    else setError("Kunde inte ta bort projektet");
  };

  return (
    <>
      <div className="topbar">
        <div className="breadcrumb">
          <span>film.coop</span>
          <span>›</span>
          <strong>Admin</strong>
        </div>
        <div className="topbar-user pill-bar">
          <a href="/projekt" className="pill">
            Projekt
          </a>
          <button className="pill" onClick={() => signOut()}>
            Logga ut
          </button>
        </div>
      </div>

      <div className="page">
        <div className="card">
          <div className="section-header">
            {editingId ? "Ändra projekt" : "Lägg till projekt"}
          </div>

          <form onSubmit={submit} className="admin-form">
            <label>
              Projektnamn
              <input
                type="text"
                value={form.namn}
                onChange={(e) => setForm({ ...form, namn: e.target.value })}
                required
              />
            </label>
            <label>
              Länk eller ID till Google Sheets-kalkylbladet
              <input
                type="text"
                value={form.spreadsheet}
                onChange={(e) => setForm({ ...form, spreadsheet: e.target.value })}
                placeholder="https://docs.google.com/spreadsheets/d/…"
                required
              />
            </label>
            <label>
              Producenter (e-post, kommaseparerade)
              <input
                type="text"
                value={form.producerEmails}
                onChange={(e) => setForm({ ...form, producerEmails: e.target.value })}
                placeholder="producent@exempel.se, medproducent@exempel.se"
              />
            </label>

            <p className="muted">
              Dela först kalkylbladet med{" "}
              <strong>{data.serviceAccountEmail || "servicekontot"}</strong> (Viewer
              räcker). Crew behöver inte läggas till här — de hittas via e-postkolumnen i
              kalkylbladet.
            </p>

            {formError && <div className="alert error">{formError}</div>}

            <div className="pill-bar">
              <button type="submit" className="pill primary" disabled={saving}>
                {saving ? "Kontrollerar…" : editingId ? "Spara" : "Lägg till"}
              </button>
              {editingId && (
                <button type="button" className="pill" onClick={cancelEdit}>
                  Avbryt
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <div className="section-header">Projekt ({data.projects.length})</div>
          {data.projects.length === 0 ? (
            <p className="muted">Inga projekt än.</p>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Namn</th>
                    <th>Producenter</th>
                    <th>Kalkylblad</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <a href={`/p/${p.id}/producer`}>{p.namn}</a>
                      </td>
                      <td>{p.producerEmails.join(", ") || "—"}</td>
                      <td>
                        <a
                          href={`https://docs.google.com/spreadsheets/d/${p.spreadsheetId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Öppna
                        </a>
                      </td>
                      <td>
                        <span className="pill-bar">
                          <button className="pill" onClick={() => startEdit(p)}>
                            Ändra
                          </button>
                          <button className="pill danger" onClick={() => remove(p)}>
                            Ta bort
                          </button>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
