"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { FormsService } from "@/modules/forms";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuestionRenderer } from "./question-renderer";
import { Save, Send, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

interface Question {
  id: string;
  label_ar: string;
  label_en: string;
  type: string;
  options: { value: string; label_ar: string; label_en: string }[] | null;
  validation: Record<string, unknown> | null;
  placeholder_ar: string | null;
  placeholder_en: string | null;
  help_text_ar: string | null;
  help_text_en: string | null;
  order_index: number;
  conditional_logic: Record<string, unknown> | null;
}

export function FormRunner({
  assignmentId, clientId, questions, locale, templateName, initialResponses = {},
}: {
  assignmentId: string;
  clientId: string;
  questions: Question[];
  locale: string;
  templateName: string;
  initialResponses?: Record<string, unknown>;
}) {
  const t = useTranslations("forms.runner");
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, unknown>>(initialResponses);
  const [currentStep, setCurrentStep] = useState<"form" | "review" | "submitted">("form");
  const [submitting, setSubmitting] = useState(false);

  const sortedQuestions = [...questions].sort((a, b) => a.order_index - b.order_index);

  const visibleQuestions = sortedQuestions.filter(q => {
    if (!q.conditional_logic) return true;
    const cl = q.conditional_logic as Record<string, Record<string, unknown>>;
    const showIf = cl.show_if;
    if (!showIf) return true;
    const parentValue = responses[showIf.question_id];
    switch (showIf.operator) {
      case "equals": return parentValue === showIf.value;
      case "not_equals": return parentValue !== showIf.value;
      case "contains": return String(parentValue ?? "").includes(String(showIf.value));
      default: return true;
    }
  });

  const completedCount = visibleQuestions.filter(q => {
    const val = responses[q.id];
    return val !== undefined && val !== null && val !== "";
  }).length;

  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraft = useCallback(async () => {
    try {
      const service = new FormsService(createClient());
      const payload = visibleQuestions.map(q => ({
        question_id: q.id,
        value: responses[q.id] ?? null,
      }));
      await service.saveDraft(clientId, assignmentId, payload);
      toast.success(t("draftSaved"));
    } catch {
      // silent
    }
  }, [clientId, assignmentId, visibleQuestions, responses, t]);

  useEffect(() => {
    if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    draftTimeoutRef.current = setTimeout(() => {
      saveDraft();
    }, 3000);
    return () => {
      if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current);
    };
  }, [responses, saveDraft]);

  async function handleSubmit() {
    const missing = visibleQuestions.filter(q => {
      if (!(q.validation?.required as boolean)) return false;
      const val = responses[q.id];
      return val === undefined || val === null || val === "";
    });
    if (missing.length > 0) {
      toast.error(`Please fill in all required fields (${missing.length} remaining)`);
      return;
    }
    setSubmitting(true);
    try {
      const service = new FormsService(createClient());
      const payload = visibleQuestions.map(q => ({
        question_id: q.id,
        value: responses[q.id] ?? null,
      }));
      await service.submitResponse(clientId, {
        assignment_id: assignmentId,
        responses: payload,
        is_draft: false,
      });
      setCurrentStep("submitted");
      toast.success(t("submitted"));
    } catch {
      toast.error("Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  }

  if (currentStep === "submitted") {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <CheckCircle className="size-16 text-primary" />
        <h2 className="text-2xl font-semibold">{t("submitted")}</h2>
        <Button onClick={() => router.push("/client/forms")}>Back to Forms</Button>
      </div>
    );
  }

  if (currentStep === "review") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        <h2 className="text-2xl font-semibold">{t("review")}</h2>
        <p className="text-sm text-muted-foreground">Review your answers before submitting.</p>
        {visibleQuestions.map(q => {
          const label = locale === "ar" && q.label_ar ? q.label_ar : q.label_en;
          const val = responses[q.id];
          return (
            <Card key={q.id} className="p-4">
              <p className="font-medium text-sm">{label}</p>
              <p className="text-muted-foreground mt-1">
                {val === undefined || val === null || val === ""
                  ? <span className="italic text-destructive">Not answered</span>
                  : typeof val === "boolean"
                    ? val ? "Yes" : "No"
                    : Array.isArray(val)
                      ? val.join(", ")
                      : typeof val === "object" && val !== null
                        ? (val as { name?: string }).name ?? "File uploaded"
                        : String(val)
                }
              </p>
            </Card>
          );
        })}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setCurrentStep("form")}>
            <ChevronLeft className="size-4 me-2" />{t("previous")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            <Send className="size-4 me-2" />{t("submit")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">{templateName}</h2>
        <p className="text-sm text-muted-foreground">
          {t("progress", { completed: completedCount, total: visibleQuestions.length })}
        </p>
        <Progress value={(completedCount / Math.max(visibleQuestions.length, 1)) * 100} className="h-2" />
      </div>

      {visibleQuestions.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">No questions to display.</Card>
      )}

      <div className="space-y-6">
        {visibleQuestions.map(q => (
          <div key={q.id}>
            <QuestionRenderer
              question={q}
              value={responses[q.id]}
              onChange={val => setResponses(prev => ({ ...prev, [q.id]: val }))}
              locale={locale}
              clientId={clientId}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={saveDraft}>
          <Save className="size-4 me-2" />{t("saveDraft")}
        </Button>
        <Button onClick={() => setCurrentStep("review")} className="ms-auto">
          {t("review")} <ChevronRight className="size-4 ms-2" />
        </Button>
      </div>
    </div>
  );
}