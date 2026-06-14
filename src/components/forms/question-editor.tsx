"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

const QUESTION_TYPES = [
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

export function QuestionEditor({
  question, allQuestions, onChange, onDelete, locale,
}: {
  question: Question;
  allQuestions: Question[];
  onChange: (updates: Partial<Question>) => void;
  onDelete: () => void;
  locale: string;
}) {
  const t = useTranslations("forms.questionEditor");
  const tb = useTranslations("forms.builder");
  const hasOptions = ["select", "multiselect", "radio"].includes(question.type);
  const hasConditionalLogic = true;

  function addOption() {
    const options = [...(question.options ?? [])];
    options.push({
      value: `opt_${options.length + 1}`,
      label_ar: "",
      label_en: "",
    });
    onChange({ options });
  }

  function updateOption(index: number, updates: Partial<{ value: string; label_ar: string; label_en: string }>) {
    const options = [...(question.options ?? [])];
    options[index] = { ...options[index], ...updates };
    onChange({ options });
  }

  function removeOption(index: number) {
    onChange({ options: (question.options ?? []).filter((_, i) => i !== index) });
  }

  const showIf = question.conditional_logic as Record<string, any> | null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{tb("questionTypes." + question.type)}</h3>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>{t("type")}</Label>
        <Select value={question.type} onValueChange={v => onChange({ type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map(ty => (
              <SelectItem key={ty} value={ty}>{tb("questionTypes." + ty)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("labelAr")}</Label>
        <Input
          value={question.label_ar}
          onChange={e => onChange({ label_ar: e.target.value })}
          dir="rtl"
        />
      </div>

      <div className="space-y-2">
        <Label>{t("labelEn")}</Label>
        <Input
          value={question.label_en}
          onChange={e => onChange({ label_en: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("placeholderAr")}</Label>
        <Input
          value={question.placeholder_ar}
          onChange={e => onChange({ placeholder_ar: e.target.value })}
          dir="rtl"
        />
      </div>

      <div className="space-y-2">
        <Label>{t("placeholderEn")}</Label>
        <Input
          value={question.placeholder_en}
          onChange={e => onChange({ placeholder_en: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("helpTextAr")}</Label>
        <Textarea
          value={question.help_text_ar}
          onChange={e => onChange({ help_text_ar: e.target.value })}
          dir="rtl"
        />
      </div>

      <div className="space-y-2">
        <Label>{t("helpTextEn")}</Label>
        <Textarea
          value={question.help_text_en}
          onChange={e => onChange({ help_text_en: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={(question.validation?.required as boolean) ?? false}
          onCheckedChange={v => onChange({ validation: { ...question.validation, required: !!v } })}
        />
        <Label>{t("required")}</Label>
      </div>

      {question.type === "number" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>{t("minValue")}</Label>
            <Input type="number" value={(question.validation?.min as string) ?? ""}
              onChange={e => onChange({ validation: { ...question.validation, min: e.target.value ? Number(e.target.value) : undefined } })} />
          </div>
          <div className="space-y-1">
            <Label>{t("maxValue")}</Label>
            <Input type="number" value={(question.validation?.max as string) ?? ""}
              onChange={e => onChange({ validation: { ...question.validation, max: e.target.value ? Number(e.target.value) : undefined } })} />
          </div>
        </div>
      )}

      {question.type === "text" && (
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label>{t("minLength")}</Label>
            <Input type="number" value={(question.validation?.min_length as string) ?? ""}
              onChange={e => onChange({ validation: { ...question.validation, min_length: e.target.value ? Number(e.target.value) : undefined } })} />
          </div>
          <div className="space-y-1">
            <Label>{t("maxLength")}</Label>
            <Input type="number" value={(question.validation?.max_length as string) ?? ""}
              onChange={e => onChange({ validation: { ...question.validation, max_length: e.target.value ? Number(e.target.value) : undefined } })} />
          </div>
        </div>
      )}

      {hasOptions && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t("options")}</Label>
            <Button variant="outline" size="sm" onClick={addOption}>
              <Plus className="size-3 me-1" />{t("addOption")}
            </Button>
          </div>
          {(question.options ?? []).map((opt, i) => (
            <div key={i} className="flex items-start gap-2 bg-muted/50 p-2 rounded-md">
              <div className="flex-1 space-y-1">
                <Input size={8} placeholder={t("optionValue")} value={opt.value}
                  onChange={e => updateOption(i, { value: e.target.value })} />
                <Input size={8} placeholder={t("optionLabelAr")} value={opt.label_ar} dir="rtl"
                  onChange={e => updateOption(i, { label_ar: e.target.value })} />
                <Input size={8} placeholder={t("optionLabelEn")} value={opt.label_en}
                  onChange={e => updateOption(i, { label_en: e.target.value })} />
              </div>
              <Button variant="ghost" size="icon" className="size-7 shrink-0 mt-1" onClick={() => removeOption(i)}>
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {hasConditionalLogic && (
        <div className="space-y-2 border-t pt-4">
          <Label>{t("conditionalLogic")}</Label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={!!showIf}
                onCheckedChange={v => onChange({
                  conditional_logic: v ? {
                    show_if: { question_id: allQuestions.find(q => q.id !== question.id)?.id ?? "", operator: "equals", value: "" }
                  } as any : null
                })}
              />
              {t("showIf")}
            </label>
          </div>
          {showIf && (
            <div className="space-y-2 pl-4">
              <Select
                value={showIf.show_if?.question_id ?? ""}
                onValueChange={v => onChange({ conditional_logic: { show_if: { ...showIf.show_if, question_id: v } } } as any)}
              >
                <SelectTrigger><SelectValue placeholder={t("selectQuestion")} /></SelectTrigger>
                <SelectContent>
                  {allQuestions.filter(q => q.id !== question.id).map(q => (
                    <SelectItem key={q.id} value={q.id}>
                      {locale === "ar" && q.label_ar ? q.label_ar : q.label_en || q.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={showIf.show_if?.operator ?? "equals"}
                onValueChange={v => onChange({ conditional_logic: { show_if: { ...showIf.show_if, operator: v } } } as any)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">{t("equals")}</SelectItem>
                  <SelectItem value="not_equals">{t("notEquals")}</SelectItem>
                  <SelectItem value="contains">{t("contains")}</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Value"
                value={showIf.show_if?.value as string ?? ""}
                onChange={e => onChange({ conditional_logic: { show_if: { ...showIf.show_if, value: e.target.value } } } as any)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}