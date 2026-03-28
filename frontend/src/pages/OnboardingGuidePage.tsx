import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../app/AuthContext";
import { ChecklistPanel } from "../components/ChecklistPanel";
import { OnboardingSidebar } from "../components/OnboardingSidebar";
import { OnboardingStepCard } from "../components/OnboardingStepCard";
import { PageHeader } from "../components/PageHeader";
import { ProgressTracker } from "../components/ProgressTracker";
import { api } from "../services/api";
import { OnboardingGuide, OnboardingProgressResponse } from "../types/domain";

export function OnboardingGuidePage({ audience }: { audience: "sales" | "client" }) {
  const { token } = useAuth();
  const [guide, setGuide] = useState<OnboardingGuide | null>(null);
  const [progress, setProgress] = useState<OnboardingProgressResponse | null>(null);
  const [activeStepId, setActiveStepId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    Promise.all([api.getOnboardingGuides(token), api.getOnboardingProgressMe(token)])
      .then(([guides, progressData]) => {
        const selected = guides.find((item) => item.audience === audience) ?? null;
        setGuide(selected);
        setProgress(progressData);
        setActiveStepId(selected?.steps[0]?.id ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar onboarding"));
  }, [token, audience]);

  const activeStep = useMemo(
    () => guide?.steps.find((step) => step.id === activeStepId) ?? guide?.steps[0] ?? null,
    [guide, activeStepId]
  );

  const completedStepIds = useMemo(
    () => new Set((progress?.progress ?? []).filter((row) => row.completed).map((row) => row.step_id)),
    [progress]
  );

  if (error) return <p className="error">{error}</p>;
  if (!guide || !progress) return <p>Cargando onboarding...</p>;

  const handleCompleteStep = async (stepId: number) => {
    if (!token) return;
    await api.completeOnboardingStep(token, { guide_id: guide.id, step_id: stepId, completed: true });
    const refreshed = await api.getOnboardingProgressMe(token);
    setProgress(refreshed);
  };

  return (
    <section>
      <PageHeader title={guide.title} subtitle={guide.description ?? "Guia paso a paso"} />
      <div className="card-grid" style={{ gridTemplateColumns: "280px 1fr" }}>
        <OnboardingSidebar steps={guide.steps} activeStepId={activeStep?.id ?? null} onSelect={setActiveStepId} />
        <div className="row-gap" style={{ alignItems: "flex-start" }}>
          {activeStep ? (
            <OnboardingStepCard
              title={activeStep.title}
              content={activeStep.content}
              completed={completedStepIds.has(activeStep.id)}
              onComplete={() => handleCompleteStep(activeStep.id)}
            />
          ) : null}
          <div style={{ minWidth: 300, display: "grid", gap: 12 }}>
            <ProgressTracker total={progress.total_steps} completed={progress.completed_steps} />
            <ChecklistPanel
              items={guide.steps.map((step) => ({
                label: step.title,
                done: completedStepIds.has(step.id)
              }))}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
