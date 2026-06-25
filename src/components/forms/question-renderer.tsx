"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";
import { StorageService } from "@/modules/storage/storage.service";
import { useRef, useState } from "react";

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
  conditional_logic: Record<string, unknown> | null;
}

export function QuestionRenderer({
  question, value, onChange, locale, error, clientId,
}: {
  question: Question;
  value: unknown;
  onChange: (value: unknown) => void;
  locale: string;
  error?: string;
  clientId?: string;
}) {
  const label = locale === "ar" && question.label_ar ? question.label_ar : question.label_en;
  const placeholder = (locale === "ar" && question.placeholder_ar ? question.placeholder_ar : question.placeholder_en) ?? undefined;
  const helpText = (locale === "ar" && question.help_text_ar ? question.help_text_ar : question.help_text_en) ?? undefined;
  const isRtl = locale === "ar";

  const renderError = error ? <p className="text-sm text-destructive">{error}</p> : null;

  function renderInput() {
    switch (question.type) {
      case "text":
        return (
          <Input
            value={(value as string) ?? ""}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            dir={isRtl ? "rtl" : "ltr"}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={(value as string) ?? ""}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            dir={isRtl ? "rtl" : "ltr"}
            rows={4}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={(value as string) ?? ""}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder={placeholder}
            min={question.validation?.min as number}
            max={question.validation?.max as number}
          />
        );

      case "select":
        return (
          <Select value={(value as string) ?? ""} onValueChange={onChange}>
            <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
            <SelectContent>
              {(question.options ?? []).map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {locale === "ar" && opt.label_ar ? opt.label_ar : opt.label_en || opt.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        const selected = (value as string[]) ?? [];
        return (
          <div className="space-y-2">
            {(question.options ?? []).map(opt => {
              const optLabel = locale === "ar" && opt.label_ar ? opt.label_ar : opt.label_en || opt.value;
              return (
                <label key={opt.value} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selected.includes(opt.value)}
                    onCheckedChange={checked => {
                      if (checked) onChange([...selected, opt.value]);
                      else onChange(selected.filter(v => v !== opt.value));
                    }}
                  />
                  {optLabel}
                </label>
              );
            })}
          </div>
        );

      case "radio":
        return (
          <div className="space-y-2">
            {(question.options ?? []).map(opt => {
              const optLabel = locale === "ar" && opt.label_ar ? opt.label_ar : opt.label_en || opt.value;
              return (
                <label key={opt.value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`q_${question.id}`}
                    value={opt.value}
                    checked={value === opt.value}
                    onChange={() => onChange(opt.value)}
                    className="accent-primary"
                  />
                  {optLabel}
                </label>
              );
            })}
          </div>
        );

      case "checkbox":
        return (
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={(value as boolean) ?? false}
              onCheckedChange={onChange}
            />
            {label}
          </label>
        );

      case "date":
        return (
          <Input
            type="date"
            value={(value as string) ?? ""}
            onChange={e => onChange(e.target.value)}
          />
        );

      case "file":
        return <FileUploadInput questionId={question.id} clientId={clientId} value={value as { path: string; name: string; mime: string; size: number } | null} onChange={onChange} locale={locale} />;

      case "scale":
        const currentVal = (value as number) ?? 0;
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {(question.options ?? []).length >= 2 && (
                <>
                  <span className="text-xs text-muted-foreground">{question.options![0].label_en}</span>
                  <span className="text-xs text-muted-foreground">{question.options![1].label_en}</span>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <Button
                  key={n}
                  variant={currentVal === n ? "default" : "outline"}
                  size="sm"
                  className="w-9 h-9 p-0"
                  onClick={() => onChange(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
          </div>
        );

      case "yes_no":
        return (
          <div className="flex gap-3">
            <Button
              variant={value === true ? "default" : "outline"}
              onClick={() => onChange(true)}
            >
              Yes
            </Button>
            <Button
              variant={value === false ? "default" : "outline"}
              onClick={() => onChange(false)}
            >
              No
            </Button>
          </div>
        );

      default:
        return <Input value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} />;
    }
  }

  if (question.type === "checkbox") {
    return (
      <div className="space-y-1">
        {renderInput()}
        {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
        {renderError}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium">
        {label}
        {(question.validation?.required as boolean) && <span className="text-destructive ms-1">*</span>}
      </Label>
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
      {renderInput()}
      {renderError}
    </div>
  );
}

function FileUploadInput({
  questionId, clientId, value, onChange, locale: _locale,
}: {
  questionId: string;
  clientId?: string;
  value: { path: string; name: string; mime: string; size: number } | null;
  onChange: (v: unknown) => void;
  locale: string;
}) {
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !clientId) return;
    setUploading(true);
    try {
      const storage = new StorageService();
      const result = await storage.uploadFormFile(clientId, questionId, file);
      onChange(result);
    } catch {
      // error handled by parent
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input type="file" ref={ref} className="hidden" onChange={handleFile} />
      {value ? (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          <FileText className="size-4" />
          <span className="text-sm flex-1 truncate">{value.name}</span>
          <Button variant="ghost" size="sm" onClick={() => onChange(null)}>X</Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => ref.current?.click()} disabled={uploading}>
          <Upload className="size-4 me-2" />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
      )}
    </div>
  );
}