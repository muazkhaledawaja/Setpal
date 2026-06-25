"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Type,
  Hash,
  SlidersHorizontal,
  Image as ImageIcon,
  ToggleLeft,
  ListChecks,
  X,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ApplyModal } from "./apply-modal";

type FieldKind = "text" | "number" | "scale" | "photo" | "yes_no" | "select";

const PALETTE: { kind: FieldKind; Icon: LucideIcon }[] = [
  { kind: "text", Icon: Type },
  { kind: "number", Icon: Hash },
  { kind: "scale", Icon: SlidersHorizontal },
  { kind: "photo", Icon: ImageIcon },
  { kind: "yes_no", Icon: ToggleLeft },
  { kind: "select", Icon: ListChecks },
];

interface CanvasField {
  uid: number;
  kind: FieldKind;
  label: string;
}

let nextUid = 100;

export function BuilderHero() {
  const t = useTranslations("landing.builderHero");

  const seed = (): CanvasField[] => [
    { uid: 1, kind: "number", label: t("seed.weight") },
    { uid: 2, kind: "scale", label: t("seed.energy") },
  ];

  const [fields, setFields] = useState<CanvasField[]>(seed);
  const [applyOpen, setApplyOpen] = useState(false);

  const addField = (kind: FieldKind) => {
    setFields((prev) => [
      ...prev,
      { uid: nextUid++, kind, label: t(`samples.${kind}`) },
    ]);
  };

  const removeField = (uid: number) => {
    setFields((prev) => prev.filter((f) => f.uid !== uid));
  };

  const reset = () => {
    nextUid = 100;
    setFields(seed());
  };

  return (
    <section className="lp-hero">
      {/* centered copy block */}
      <div className="lp-hero-copy">
        <span className="lp-eyebrow">{t("eyebrow")}</span>
        <h1 className="lp-hero-title">{t("title")}</h1>
        <p className="lp-hero-sub">{t("sub")}</p>
        <div className="lp-hero-cta">
          <button
            type="button"
            onClick={() => setApplyOpen(true)}
            className="lp-btn lp-btn-primary lp-btn-lg"
          >
            {t("ctaPrimary")}
          </button>
          <a href="#how" className="lp-btn lp-btn-ghost lp-btn-lg">
            {t("ctaSecondary")}
            <ArrowRight size={16} strokeWidth={2} className="rtl:rotate-180" />
          </a>
        </div>
        <div className="lp-hero-note">
          <CheckCircle2 size={15} strokeWidth={2} /> {t("note")}
        </div>
      </div>

      {/* interactive builder widget — centered below copy */}
      <div className="lp-hero-visual">
        <div className="lp-builder">
          <div className="lp-builder-head">
            <span className="lp-builder-title">{t("panelTitle")}</span>
            {fields.length > 0 && (
              <button type="button" className="lp-builder-reset" onClick={reset}>
                {t("reset")}
              </button>
            )}
          </div>

          <div className="lp-builder-palette" role="group" aria-label={t("paletteLabel")}>
            {PALETTE.map(({ kind, Icon }) => (
              <button
                key={kind}
                type="button"
                className="lp-chip"
                onClick={() => addField(kind)}
                aria-label={`${t("paletteLabel")}: ${t(`fields.${kind}`)}`}
              >
                <Icon size={15} strokeWidth={2} />
                {t(`fields.${kind}`)}
                <Plus size={13} strokeWidth={2.5} className="lp-chip-plus" />
              </button>
            ))}
          </div>
          <p className="lp-builder-hint">{t("addHint")}</p>

          <div className="lp-builder-preview-label">{t("preview")}</div>
          <div className="lp-canvas">
            {fields.length === 0 ? (
              <div className="lp-canvas-empty">{t("empty")}</div>
            ) : (
              fields.map((f) => (
                <CanvasFieldView
                  key={f.uid}
                  field={f}
                  removeLabel={t("remove")}
                  yes={t("yes")}
                  no={t("no")}
                  selectOptions={t("selectOptions")}
                  onRemove={() => removeField(f.uid)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* scroll hint */}
      <div className="lp-scroll-hint" aria-hidden="true">
        <ChevronDown size={20} strokeWidth={2} />
      </div>

      <ApplyModal open={applyOpen} onOpenChange={setApplyOpen} />
    </section>
  );
}

function CanvasFieldView({
  field,
  removeLabel,
  yes,
  no,
  selectOptions,
  onRemove,
}: {
  field: CanvasField;
  removeLabel: string;
  yes: string;
  no: string;
  selectOptions: string;
  onRemove: () => void;
}) {
  return (
    <div className="lp-cf">
      <button
        type="button"
        className="lp-cf-remove"
        onClick={onRemove}
        aria-label={removeLabel}
      >
        <X size={13} strokeWidth={2.5} />
      </button>
      <label className="lp-cf-label">{field.label}</label>
      <FieldControl kind={field.kind} yes={yes} no={no} selectOptions={selectOptions} />
    </div>
  );
}

function FieldControl({
  kind,
  yes,
  no,
  selectOptions,
}: {
  kind: FieldKind;
  yes: string;
  no: string;
  selectOptions: string;
}) {
  switch (kind) {
    case "text":
      return <div className="lp-cf-input" />;
    case "number":
      return <div className="lp-cf-input lp-cf-input-sm" />;
    case "scale":
      return (
        <div className="lp-cf-scale">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={"lp-cf-dot" + (i < 6 ? " on" : "")} />
          ))}
        </div>
      );
    case "photo":
      return (
        <div className="lp-cf-photo">
          <ImageIcon size={18} strokeWidth={1.75} />
        </div>
      );
    case "yes_no":
      return (
        <div className="lp-cf-yn">
          <span className="lp-cf-pill on">{yes}</span>
          <span className="lp-cf-pill">{no}</span>
        </div>
      );
    case "select":
      return (
        <div className="lp-cf-select">
          {selectOptions.split("·").map((opt, i) => (
            <span key={i} className={"lp-cf-pill" + (i === 0 ? " on" : "")}>
              {opt.trim()}
            </span>
          ))}
        </div>
      );
  }
}
