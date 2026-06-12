import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ActivitiesTable } from "./activities-table";
import { AuthNav } from "./auth-nav";
import { CurrentFormCards } from "./current-form-cards";
import { PersonalRecordsTable } from "./personal-records-table";
import { ProfileThemeForm } from "./profile-theme-form";
import { SummaryCards } from "./summary-cards";
import { WeeklyLoadChart } from "./weekly-load-chart";
import i18n from "@/lib/i18n";
import type { Activity, AuthUser } from "@/lib/types";

// next-themes / next-navigation / auth-queries are stubbed; useTranslation uses the
// real singleton so we can assert genuine Spanish catalog output (AC-9).
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@/lib/auth-queries", () => ({
  useCurrentUser: () => ({ data: null, isLoading: false }),
  useLogout: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateTheme: () => ({ mutate: vi.fn() }),
}));

const user: AuthUser = {
  id: "u1",
  email: "user@example.com",
  username: "carlos",
  photoUpdatedAt: null,
  themePreference: "system",
  languagePreference: "es",
};

beforeAll(async () => {
  await i18n.changeLanguage("es");
});
afterAll(async () => {
  await i18n.changeLanguage("en");
});

describe("Spanish render across surfaces (AC-9)", () => {
  it("nav: renders the logged-out links in Spanish", () => {
    render(<AuthNav />);
    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
    expect(screen.getByText("Registrarse")).toBeInTheDocument();
  });

  it("profile: the theme form renders Spanish copy", () => {
    render(<ProfileThemeForm user={user} />);
    expect(screen.getByText("Apariencia")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Claro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Oscuro" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sistema" })).toBeInTheDocument();
  });

  it("activities: the table headers and pagination render in Spanish", () => {
    const rows: Activity[] = Array.from({ length: 25 }, (_, i) => ({
      id: String(i),
      type: "Run",
      distance: 1000,
      duration: 600,
      avgHr: 140,
      externalStravaId: i,
      startDate: "2026-06-01T00:00:00Z",
      trainingLoad: 84000,
    }));
    render(
      <ActivitiesTable
        rows={rows}
        types={["All", "Run"]}
        allValue="All"
        typeFilter="All"
        onTypeChange={vi.fn()}
        page={0}
        size={25}
        total={60}
        totalPages={3}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Tipo")).toBeInTheDocument();
    expect(screen.getByText("Distancia")).toBeInTheDocument();
    expect(screen.getByText("Carga de entrenamiento")).toBeInTheDocument();
    // The "All" sentinel is translated; activity-type names stay as backend data.
    expect(screen.getByRole("button", { name: "Todas" })).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1–25 de 60")).toBeInTheDocument();
    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
  });

  it("insights: summary, records, current-form and weekly-load render in Spanish", () => {
    render(<SummaryCards activities={[]} />);
    expect(screen.getByText("Total de actividades")).toBeInTheDocument();

    render(
      <PersonalRecordsTable
        records={[
          { type: "Run", maxDistance: 5000, maxDuration: 1800, bestPaceSecPerKm: 300 },
        ]}
      />,
    );
    expect(screen.getByText("Distancia máxima")).toBeInTheDocument();
    expect(screen.getByText("Mejor ritmo")).toBeInTheDocument();

    render(
      <CurrentFormCards current={{ ctl: 50, atl: 40, tsb: 10, formLabel: "fresh" }} />,
    );
    expect(screen.getByText("Forma física (CTL)")).toBeInTheDocument();
    expect(screen.getByText("en forma")).toBeInTheDocument();

    render(
      <WeeklyLoadChart
        data={[{ weekStart: "2026-06-01", load: 700, recommendedLoad: 650 }]}
      />,
    );
    expect(screen.getByText("Carga semanal")).toBeInTheDocument();
    expect(screen.getByText("Recomendado")).toBeInTheDocument();
  });
});
