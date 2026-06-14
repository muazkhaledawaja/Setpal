"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/browser";
import { FormsService } from "@/modules/forms";
import { CreateTemplateInput } from "@/modules/forms/forms.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Trash2, GripVertical, Eye, Copy, ChevronUp, ChevronDown,
} from "lucide-react";
import { QuestionEditor } from "./question-editor";

const QUESTION_TYPES_LIST = [
  "text", "textarea", "number", "select", "multiselect",
  "radio", "checkbox", "date", "file", "scale", "yes_no",
] as const;

interface Question {
  id: string;
  label_ar: string;
  label_en: string;
  type: string;
  options: { value: string; label_ar: string; label_en: string }[];
  validation: Record<string, unknown>;
  placeholder_ar: string;
  placeholder_en: string;
  help_text_ar: string;
  help_text_en: string;
  order_index: number;
  conditional_logic: Record<string, unknown> | null;
}

export function FormBuilder({
  coachId,
  locale,
  templateId,
  initialData,
}: {
  coachId: string;
  locale: string;
  templateId?: string;
  initialData?: {
    name: string;
    description_ar: string;
    description_en: string;
    type: string;
    settings: Record<string, unknown>;
    questions: Question[];
  };
}) {
  const t = useTranslations("forms");
  const router = useRouter();
  const [name, setName] = useState(initialData?.name ?? "");
  const [descriptionAr, setDescriptionAr] = useState(initialData?.description_ar ?? "");
  const [descriptionEn, setDescriptionEn] = useState(initialData?.description_en ?? "");
  const [formType, setFormType] = useState(initialData?.type ?? "custom");
  const [settings, setSettings] = useState<Record<string, unknown>>(
    initialData?.settings ?? { allow_draft_save: true, reminder_enabled: true }
  );
  const [questions, setQuestions] = useState<Question[]>(initialData?.questions ?? []);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function addQuestion() {
    const id = crypto.randomUUID();
    const newQ: Question = {
      id, label_ar: "", label_en: "", type: "text",
      options: [], validation: {},
      placeholder_ar: "", placeholder_en: "",
      help_text_ar: "", help_text_en: "",
      order_index: questions.length, conditional_logic: null,
    };
    setQuestions([...questions, newQ]);
    setActiveQuestionId(id);
  }

  function updateQuestion(id: string, updates: Partial<Question>) {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  }

  function removeQuestion(id: string) {
    setQuestions(questions.filter(q => q.id !== id));
    if (activeQuestionId === id) setActiveQuestionId(null);
  }

  function moveQuestion(id: string, direction: "up" | "down") {
    const idx = questions.findIndex(q => q.id === id);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const updated = [...questions];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    updated.forEach((q, i) => q.order_index = i);
    setQuestions(updated);
  }

  async function save() {
    if (!name.trim()) {
      toast.error(t("errors.required"));
      return;
    }
    if (questions.length === 0) {
      toast.error(t("errors.addQuestion"));
      return;
    }
    setSaving(true);
    try {
      const service = new FormsService(createClient());
      const input: CreateTemplateInput = {
        name, description_ar: descriptionAr || undefined,
        description_en: descriptionEn || undefined,
        type: formType as "onboarding" | "check_in" | "custom",
        settings: Object.keys(settings).length > 0 ? settings as any : undefined,
        questions: questions.map((q) => ({
          label_ar: q.label_ar, label_en: q.label_en, type: q.type as any,
          options: q.options.length > 0 ? q.options : undefined,
          validation: Object.keys(q.validation).length > 0 ? q.validation as any : undefined,
          placeholder_ar: q.placeholder_ar || undefined,
          placeholder_en: q.placeholder_en || undefined,
          help_text_ar: q.help_text_ar || undefined,
          help_text_en: q.help_text_en || undefined,
          order_index: q.order_index,
          conditional_logic: q.conditional_logic as any || undefined,
        })),
      };

      if (templateId) {
        await service.updateTemplate(coachId, { id: templateId, ...input });
      } else {
        await service.createTemplate(coachId, input);
      }

      toast.success(t("builder.saved"));
      router.push("/coach/forms");
    } catch {
      toast.error(templateId ? t("errors.updateFailed") : t("errors.createFailed"));
    } finally {
      setSaving(false);
    }
  }

  const activeQuestion = questions.find(q => q.id === activeQuestionId) ?? null;

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      <div className="flex-1 space-y-4 overflow-y-auto pb-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("builder.templateName")}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={t("builder.templateName")} />
          </div>
          <div className="space-y-2">
            <Label>{t("builder.formType")}</Label>
            <Select value={formType} onValueChange={setFormType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="onboarding">{t("typeLabels.onboarding")}</SelectItem>
                <SelectItem value="check_in">{t("typeLabels.check_in")}</SelectItem>
                <SelectItem value="custom">{t("typeLabels.custom")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("questionEditor.labelAr")}</Label>
            <Textarea value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("questionEditor.labelEn")}</Label>
            <Textarea value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">{t("builder.addQuestion")}</Label>
          <Button onClick={addQuestion} size="sm"><Plus className="size-4 me-2" />{t("builder.addQuestion")}</Button>
        </div>

        {questions.length === 0 && (
          <Card className="p-12 text-center text-muted-foreground">
            {t("questionEditor.helpTextEn")} — {t("builder.subtitle")}
          </Card>
        )}

        {questions.map((q, i) => (
          <Card
            key={q.id}
            className={`p-4 space-y-3 cursor-pointer transition-colors ${activeQuestionId === q.id ? "ring-2 ring-primary" : "hover:bg-accent/50"}`}
            onClick={() => setActiveQuestionId(q.id)}
          >
            <div className="flex items-center gap-3">
              <GripVertical className="size-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {locale === "ar" && q.label_ar ? q.label_ar : q.label_en || t("builder.questionTypes." + q.type)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("builder.questionTypes." + q.type)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="size-7" onClick={e => { e.stopPropagation(); moveQuestion(q.id, "up"); }} disabled={i === 0}>
                  <ChevronUp className="size-3" />
                </Button>
                <Button variant="ghost" size="icon" className="size-7" onClick={e => { e.stopPropagation(); moveQuestion(q.id, "down"); }} disabled={i === questions.length - 1}>
                  <ChevronDown className="size-3" />
                </Button>
                <Button variant="ghost" size="icon" className="size-7 text-destructive" onClick={e => { e.stopPropagation(); removeQuestion(q.id); }}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => router.push("/coach/forms")}>{t("back")}</Button>
          <Button onClick={save} disabled={saving || !name.trim()}>{t("builder.save")}</Button>
        </div>
      </div>

      {activeQuestion && (
        <div className="w-96 shrink-0 border-s pl-6 overflow-y-auto pb-8">
          <QuestionEditor
            question={activeQuestion}
            allQuestions={questions}
            onChange={(updates) => updateQuestion(activeQuestion.id, updates)}
            onDelete={() => removeQuestion(activeQuestion.id)}
            locale={locale}
          />
        </div>
      )}
    </div>
  );
}