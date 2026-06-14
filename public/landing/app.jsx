// Setpal marketing landing — React + Babel. Uses window.SETPAL_COPY + tweaks-panel.jsx.
const { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle } = window;
const COPY = window.SETPAL_COPY;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#1f6b6e",
  "heroLayout": "split",
  "corners": "soft",
  "showPricing": true
}/*EDITMODE-END*/;

function Icon({ name, size = 20, style }) {
  return <i data-lucide={name} style={{ width: size, height: size, display: "inline-flex", ...style }} />;
}

function useLucide(dep) {
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
}

/* ---------------- Nav ---------------- */
function Nav({ c, lang, setLang }) {
  return (
    <header className="lp-nav">
      <div className="lp-nav-inner">
        <div className="lp-logo">Setpal</div>
        <nav className="lp-nav-links">
          <a href="#features">{c.nav.features}</a>
          <a href="#how">{c.nav.how}</a>
          <a href="#pricing">{c.nav.pricing}</a>
          <a href="#faq">{c.nav.faq}</a>
        </nav>
        <div className="lp-nav-right">
          <button className="lp-lang" onClick={() => setLang(lang === "en" ? "ar" : "en")}>
            <Icon name="languages" size={16} />
            <span>{lang === "en" ? "العربية" : "English"}</span>
          </button>
          <a href="#" className="lp-link-signin">{c.nav.signin}</a>
          <a href="#" className="lp-btn lp-btn-primary lp-btn-sm">{c.nav.cta}</a>
        </div>
      </div>
    </header>
  );
}

/* ---------------- App mock (real product shot) ---------------- */
function AppMock({ c, lang }) {
  const m = c.appmock;
  const rows = [
    { name: lang === "ar" ? "ليلى حسن" : "Layla Hassan", date: lang === "ar" ? "١٢ يناير" : "12 Jan", st: "active" },
    { name: lang === "ar" ? "عمر سعيد" : "Omar Said", date: lang === "ar" ? "٣ فبراير" : "03 Feb", st: "active" },
    { name: lang === "ar" ? "نور خليل" : "Nour Khalil", date: lang === "ar" ? "٢٨ نوفمبر" : "28 Nov", st: "paused" },
  ];
  const stats = [
    { ic: "users", label: m.clients, val: "18", tint: "var(--lp-accent)" },
    { ic: "clipboard-check", label: m.checkins, val: "5", tint: "var(--warning)" },
    { ic: "credit-card", label: m.sub, val: m.plan, tint: "var(--muted-foreground)" },
  ];
  return (
    <div className="lp-mock">
      <div className="lp-mock-bar">
        <span className="lp-dot" style={{ background: "#e06a5a" }} />
        <span className="lp-dot" style={{ background: "#e3b34d" }} />
        <span className="lp-dot" style={{ background: "#5aa56b" }} />
      </div>
      <div className="lp-mock-body">
        <aside className="lp-mock-side">
          <div className="lp-mock-brand">Setpal</div>
          {["layout-dashboard", "users", "dumbbell", "clipboard-list"].map((ic, i) => (
            <div key={ic} className={"lp-mock-nav" + (i === 0 ? " on" : "")}><Icon name={ic} size={15} /></div>
          ))}
        </aside>
        <div className="lp-mock-main">
          <div className="lp-mock-h">{m.title}</div>
          <div className="lp-mock-stats">
            {stats.map((s) => (
              <div key={s.label} className="lp-mock-stat">
                <div className="lp-mock-stat-top">
                  <span>{s.label}</span><span style={{ color: s.tint }}><Icon name={s.ic} size={14} /></span>
                </div>
                <div className="lp-mock-stat-v">{s.val}</div>
              </div>
            ))}
          </div>
          <div className="lp-mock-recent">{m.recent}</div>
          <div className="lp-mock-list">
            {rows.map((r) => (
              <div key={r.name} className="lp-mock-row">
                <div className="lp-mock-ava">{r.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}</div>
                <div className="lp-mock-row-id">
                  <div className="lp-mock-name">{r.name}</div>
                  <div className="lp-mock-meta">{m.joined} {r.date}</div>
                </div>
                <span className={"lp-mock-pill " + r.st}>{r.st === "active" ? m.active : m.paused}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Hero ---------------- */
function Hero({ c, lang, layout }) {
  return (
    <section className={"lp-hero " + (layout === "centered" ? "is-centered" : "is-split")}>
      <div className="lp-hero-copy">
        <span className="lp-eyebrow">{c.hero.eyebrow}</span>
        <h1 className="lp-hero-title">{c.hero.title}</h1>
        <p className="lp-hero-sub">{c.hero.sub}</p>
        <div className="lp-hero-cta">
          <a href="#" className="lp-btn lp-btn-primary lp-btn-lg">{c.hero.ctaPrimary}</a>
          <a href="#how" className="lp-btn lp-btn-ghost lp-btn-lg">{c.hero.ctaSecondary} <Icon name="arrow-right" size={16} /></a>
        </div>
        <div className="lp-hero-note"><Icon name="check-circle-2" size={15} /> {c.hero.note}</div>
      </div>
      <div className="lp-hero-visual"><AppMock c={c} lang={lang} /></div>
    </section>
  );
}

/* ---------------- Features ---------------- */
function Features({ c }) {
  return (
    <section className="lp-section" id="features">
      <div className="lp-section-head">
        <h2>{c.features.title}</h2>
        <p>{c.features.sub}</p>
      </div>
      <div className="lp-feat-grid">
        {c.features.items.map((f) => (
          <div key={f.title} className="lp-card lp-feat">
            <div className="lp-feat-ic"><Icon name={f.icon} size={22} /></div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */
function How({ c }) {
  return (
    <section className="lp-section lp-how" id="how">
      <div className="lp-section-head"><h2>{c.how.title}</h2></div>
      <div className="lp-how-grid">
        {c.how.steps.map((s, i) => (
          <div key={s.n} className="lp-step">
            <div className="lp-step-n">{s.n}</div>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            {i < c.how.steps.length - 1 && <div className="lp-step-line" />}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- MENA / bilingual ---------------- */
function Mena({ c }) {
  return (
    <section className="lp-section">
      <div className="lp-mena lp-card">
        <div className="lp-mena-copy">
          <span className="lp-eyebrow">{c.mena.eyebrow}</span>
          <h2>{c.mena.title}</h2>
          <p>{c.mena.body}</p>
          <ul className="lp-mena-points">
            {c.mena.points.map((p) => (
              <li key={p}><Icon name="check" size={16} /> {p}</li>
            ))}
          </ul>
        </div>
        <div className="lp-mena-glyph">
          <div className="lp-glyph-ar">ع</div>
          <div className="lp-glyph-swap"><Icon name="arrow-left-right" size={20} /></div>
          <div className="lp-glyph-en">En</div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Pricing ---------------- */
function Pricing({ c }) {
  return (
    <section className="lp-section" id="pricing">
      <div className="lp-section-head"><h2>{c.pricing.title}</h2><p>{c.pricing.sub}</p></div>
      <div className="lp-price-grid">
        {c.pricing.tiers.map((t) => (
          <div key={t.name} className={"lp-card lp-price" + (t.popular ? " is-pop" : "")}>
            {t.popular && <span className="lp-price-badge">{c.pricing.popular}</span>}
            <div className="lp-price-name">{t.name}</div>
            <div className="lp-price-amt">{t.price}{t.price.match(/[0-9٠-٩]/) ? <span className="lp-price-per">{c.pricing.perMonth}</span> : null}</div>
            <div className="lp-price-desc">{t.desc}</div>
            <div className="lp-price-limit"><Icon name="users" size={15} /> {t.limit}</div>
            <a href="#" className={"lp-btn lp-btn-block " + (t.popular ? "lp-btn-primary" : "lp-btn-outline")}>{c.pricing.cta}</a>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
function FAQ({ c }) {
  const [open, setOpen] = React.useState(0);
  return (
    <section className="lp-section lp-faq" id="faq">
      <div className="lp-section-head"><h2>{c.faq.title}</h2></div>
      <div className="lp-faq-list">
        {c.faq.items.map((it, i) => (
          <div key={i} className={"lp-card lp-faq-item" + (open === i ? " is-open" : "")} onClick={() => setOpen(open === i ? -1 : i)}>
            <div className="lp-faq-q">
              <span>{it.q}</span>
              <Icon name={open === i ? "minus" : "plus"} size={18} />
            </div>
            {open === i && <p className="lp-faq-a">{it.a}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
function Footer({ c }) {
  return (
    <footer className="lp-footer">
      <div className="lp-footer-cta lp-card">
        <h2>{c.footer.title}</h2>
        <p>{c.footer.sub}</p>
        <a href="#" className="lp-btn lp-btn-primary lp-btn-lg">{c.footer.cta}</a>
      </div>
      <div className="lp-footer-bottom">
        <div className="lp-logo">Setpal</div>
        <div className="lp-footer-copy">{c.footer.copyright}</div>
      </div>
    </footer>
  );
}

/* ---------------- App ---------------- */
const RADII = {
  rounded: { card: "0.875rem", btn: "0.625rem" },
  soft: { card: "0.625rem", btn: "0.375rem" },
  sharp: { card: "0.25rem", btn: "0.25rem" },
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [lang, setLang] = React.useState("en");
  const c = COPY[lang];
  useLucide(lang + t.accent + t.corners + t.showPricing + t.heroLayout);

  const r = RADII[t.corners] || RADII.soft;
  const rootStyle = {
    "--lp-accent": t.accent,
    "--lp-r-card": r.card,
    "--lp-r-btn": r.btn,
  };

  return (
    <div className="lp-root" dir={c.dir} style={rootStyle}>
      <Nav c={c} lang={lang} setLang={setLang} />
      <main>
        <Hero c={c} lang={lang} layout={t.heroLayout} />
        <Features c={c} />
        <How c={c} />
        <Mena c={c} />
        {t.showPricing && <Pricing c={c} />}
        <FAQ c={c} />
      </main>
      <Footer c={c} />

      <TweaksPanel>
        <TweakSection label="Brand" />
        <TweakColor label="Accent" value={t.accent}
          options={["#1f6b6e", "#0e4d50", "#b0562f", "#3c6b46"]}
          onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Hero" value={t.heroLayout} options={["split", "centered"]}
          onChange={(v) => setTweak("heroLayout", v)} />
        <TweakRadio label="Corners" value={t.corners} options={["rounded", "soft", "sharp"]}
          onChange={(v) => setTweak("corners", v)} />
        <TweakToggle label="Show pricing" value={t.showPricing}
          onChange={(v) => setTweak("showPricing", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
