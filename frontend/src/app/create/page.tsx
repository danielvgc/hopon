"use client";

import WebLayout from "@/components/web-layout";
import LocationPicker from "@/components/location-picker";
import { Api } from "@/lib/api";
import { AVAILABLE_SPORTS } from "@/lib/sports";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function CreatePage() {
  React.useEffect(() => {
    document.title = "Create Game - HopOn";
  }, []);

  const { status } = useAuth();
  const router = useRouter();
  const isAuthenticated = status === "authenticated";

  const [form, setForm] = React.useState({
    name: "",
    sport: "Basketball",
    location: { address: "", lat: undefined as number | undefined, lng: undefined as number | undefined },
    event_date: "",
    max_players: 10,
    skill_level: "Intermediate",
    notes: "",
  });
  const [result, setResult] = React.useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await Api.createEvent({
        name: form.name,
        sport: form.sport,
        location: form.location.address,
        latitude: form.location.lat,
        longitude: form.location.lng,
        event_date: form.event_date ? new Date(form.event_date).toISOString() : undefined,
        max_players: form.max_players,
        skill_level: form.skill_level,
        notes: form.notes.trim() ? form.notes.trim() : undefined,
      });
      setResult(`Created: ${res.event.name}`);
      setForm({ ...form, name: "", location: { address: "", lat: undefined, lng: undefined }, event_date: "", notes: "" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create event";
      setResult(message);
    }
  }

  return (
    <WebLayout title="Create Event">
      {!isAuthenticated && (
        <div className="mb-6 rounded-2xl border border-amber-600/50 bg-amber-500/10 p-6 text-center">
          <h2 className="mb-2 text-lg sm:text-xl font-bold text-amber-400">Authentication Required</h2>
          <p className="mb-4 text-sm sm:text-base text-amber-100/80">You need to be logged in to create an event.</p>
          <div className="flex gap-3 justify-center flex-col sm:flex-row">
            <button
              onClick={() => router.push("/signup")}
              className="rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 sm:py-3 font-semibold text-white text-sm sm:text-base transition"
            >
              Sign Up
            </button>
            <button
              onClick={() => router.push("/login")}
              className="rounded-lg sm:rounded-xl bg-green-600 hover:bg-green-500 px-4 py-2 sm:py-3 font-semibold text-white text-sm sm:text-base transition"
            >
              Log In
            </button>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="max-w-2xl mx-auto space-y-3 sm:space-y-4" style={{ opacity: isAuthenticated ? 1 : 0.5, pointerEvents: isAuthenticated ? "auto" : "none" }}>
        <Field label="Event Name">
          <input
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full rounded-lg sm:rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm"
            required
            disabled={!isAuthenticated}
          />
        </Field>
        <Field label="Sport">
          <select
            value={form.sport}
            onChange={(e) => update("sport", e.target.value)}
            className="w-full rounded-lg sm:rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm"
            disabled={!isAuthenticated}
          >
            {AVAILABLE_SPORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Location">
          <LocationPicker
            value={form.location.address ? form.location : null}
            onChange={(loc) => update("location", loc)}
            placeholder="Search for event location..."
          />
        </Field>
        <Field label="Date & Time">
          <input
            type="datetime-local"
            value={form.event_date}
            onChange={(e) => update("event_date", e.target.value)}
            className="w-full rounded-lg sm:rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm"
            disabled={!isAuthenticated}
            style={{ 
              boxSizing: 'border-box',
              WebkitAppearance: 'none',
              WebkitBorderRadius: '8px'
            }}
          />
        </Field>
        <Field label="Max Players">
          <input
            type="number"
            min={2}
            value={form.max_players}
            onChange={(e) => update("max_players", parseInt(e.target.value || "0", 10))}
            className="w-full rounded-lg sm:rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm"
            disabled={!isAuthenticated}
          />
        </Field>
        <Field label="Level">
          <select
            value={form.skill_level}
            onChange={(e) => update("skill_level", e.target.value)}
            className="w-full rounded-lg sm:rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm"
            disabled={!isAuthenticated}
          >
            {['Beginner','Intermediate','Advanced'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Description (optional)">
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            className="w-full rounded-lg sm:rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm"
            rows={3}
            placeholder="Share extra details, gear requirements, or meetup instructions."
            disabled={!isAuthenticated}
          />
        </Field>
        <button
          type="submit"
          disabled={!isAuthenticated}
          className="w-full rounded-lg sm:rounded-xl bg-red-500 px-4 py-2 sm:py-3 font-semibold text-white hover:bg-red-400 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create
        </button>
        {result && <p className="text-center text-xs sm:text-sm text-neutral-300">{result}</p>}
      </form>
    </WebLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 sm:mb-2 text-xs sm:text-sm text-neutral-300 font-medium">{label}</div>
      {children}
    </label>
  );
}
