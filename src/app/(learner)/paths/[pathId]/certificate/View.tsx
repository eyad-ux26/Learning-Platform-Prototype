"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Award, Check, ChevronLeft, Copy, Lock, MessageCircle, Play, Printer, Share2, Trophy } from "lucide-react";
import { certificateCode, certificateQuery, readCertificateQuery, shareLinks } from "@/domain/certificate";
import { PRODUCT_NAME } from "@/i18n/en";
import { useI18n } from "@/i18n";
import { useApp, usePathView, type PathView } from "@/state/AppState";
import { SkillRing, skillHue } from "@/components/SkillRing";
import { Confetti } from "@/components/Celebrate";
import { playSfx } from "@/components/sfx";
import { LinkButton, Notice, cn } from "@/components/ui";
import { Unavailable } from "@/learner/Unavailable";
import { useRouteParams } from "@/state/routeParams";
import { useBadges } from "@/learner/useBadges";

const subscribe = () => () => {};

export function CertificatePage({ params }: { params?: Record<string, string> } = {}) {
  const { pathId } = useRouteParams<{ pathId: string }>(params);
  const search = useSyncExternalStore(subscribe, () => window.location.search, () => "");
  const { tr, date } = useI18n();
  const { learner } = useApp();
  const view = usePathView(pathId);
  const badges = useBadges();
  if (!view || !view.visible) return <Unavailable title={tr("This path isn’t available")} />;
  const { bundle } = view;
  const shared = readCertificateQuery(search);
  const completion = badges.find((b) => b.id === "path-complete" && b.pathId === bundle.meta.id);
  const own = view.completion.complete && completion ? { name: learner.name, date: completion.at.slice(0, 10), code: certificateCode(learner.id, bundle.meta.id, completion.at) } : undefined;
  // A shared link shows the certificate it carries, unless it is the viewer's own.
  const cert = shared && shared.code !== own?.code ? shared : own;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <nav aria-label={tr("Breadcrumb")} className="flex items-center gap-3 font-mono text-[13px] text-muted">
        <Link href={`/paths/${bundle.meta.id}`} aria-label={tr("Back to path")} className="press flex h-10 w-10 items-center justify-center rounded-[10px] border border-line text-[#d4d3de]">
          <ChevronLeft size={18} aria-hidden />
        </Link>
        <span className="min-w-0 truncate">{bundle.meta.title} / <span className="text-fg">{tr("Certificate")}</span></span>
      </nav>

      {cert ? (
        <>
          <h1 className="sr-only">{tr("Certificate")} · {bundle.meta.title}</h1>
          {cert === shared && (
            <Notice tone="neutral" className="mt-6" title={tr("A shared certificate")}>
              {tr("This link carries the certificate details. The prototype has no issuing service, so it can’t be verified.")}
            </Notice>
          )}
          <div className="relative mt-6">
            {cert === own && <Confetti count={30} spread={220} />}
            <Certificate view={view} name={cert.name} dateText={date(`${cert.date}T12:00:00Z`)} code={cert.code} />
          </div>
          {cert === own && <SharePanel pathTitle={bundle.meta.title} cert={cert} />}
        </>
      ) : (
        <Locked view={view} />
      )}
      <p className="mt-6 text-xs text-subtle">{tr("Prototype certificate. It is issued only when every required skill is Mastered, and it is not an accredited or verified credential.")}</p>
    </div>
  );
}

/** The certificate itself: light, printable, and in the Canvas style (dot grid, frame tag, selection handles). */
function Certificate({ view, name, dateText, code }: { view: PathView; name: string; dateText: string; code: string }) {
  const { tr } = useI18n();
  const { bundle } = view;
  const required = bundle.skills.filter((s) => bundle.requiredSkillIds.includes(s.id));
  return (
    <article
      id="certificate"
      aria-label={tr("Certificate")}
      className="relative overflow-hidden rounded-[26px] border-[1.5px] border-[#d9d5ff] bg-white p-6 text-[#17152e] shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:p-10"
      style={{ backgroundImage: "radial-gradient(#e6e3f7 1.2px, transparent 1.2px)", backgroundSize: "22px 22px" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight">
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-strong" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l7 17 2.5-7.5L21 11z" /></svg>
          </span>
          {PRODUCT_NAME}
        </span>
        <span className="rounded-md bg-[#f1effc] px-2 py-1 font-mono text-[11px] font-semibold tracking-[0.12em] text-[#5a4fd6]">{tr("CERTIFICATE OF COMPLETION")}</span>
      </div>

      <div className="mt-8 text-center sm:mt-10">
        <p className="font-mono text-xs text-[#5a5680]">{tr("This certifies that")}</p>
        <p className="relative mx-auto mt-3 inline-block px-3 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          {/* Selection handles: the name is the selected layer. */}
          <span aria-hidden className="absolute -inset-x-1 -inset-y-1 rounded-sm outline outline-[1.5px] outline-[#7b6cff]" />
          {["-start-2 -top-2", "-end-2 -top-2", "-start-2 -bottom-2", "-end-2 -bottom-2"].map((c) => (
            <span key={c} aria-hidden className={cn("absolute h-2.5 w-2.5 border-[1.5px] border-[#7b6cff] bg-white", c)} />
          ))}
          {name}
        </p>
        <p className="mt-5 font-mono text-xs text-[#5a5680]">{tr("completed the path")}</p>
        <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[#5a4fd6] sm:text-3xl">{bundle.meta.title}</p>
        <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label={tr("Skills mastered")}>
          {required.map((s) => (
            <li key={s.id} className="inline-flex items-center gap-1.5 rounded-full border border-[#e6e3f7] bg-white px-3 py-1.5 text-[13px] font-semibold">
              <span className="flex h-4 w-4 items-center justify-center rounded-full text-[#101014]" style={{ background: skillHue(bundle.skills.indexOf(s)) }} aria-hidden>
                <Check size={10} strokeWidth={3.5} />
              </span>
              {s.name}
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-4 max-w-md text-xs text-[#5a5680]">{tr("Every skill Mastered: its criteria met in at least two different contexts, at least one without hints.")}</p>
      </div>

      <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-[#e6e3f7] pt-5">
        <dl className="flex flex-wrap gap-x-8 gap-y-2">
          <div>
            <dt className="font-mono text-[10.5px] text-[#5a5680]">{tr("Date")}</dt>
            <dd className="text-sm font-semibold">{dateText}</dd>
          </div>
          <div>
            <dt className="font-mono text-[10.5px] text-[#5a5680]">{tr("Certificate ID")}</dt>
            <dd dir="ltr" className="font-mono text-sm font-semibold">{code}</dd>
          </div>
        </dl>
        <span className="relative flex h-[72px] w-[72px] items-center justify-center" aria-hidden>
          <svg viewBox="0 0 56 56" width="72" height="72" className="absolute inset-0"><path d="M28 3 L50 15.5 V40.5 L28 53 L6 40.5 V15.5 Z" fill="#7b6cff" stroke="#ffc94d" strokeWidth="2.5" strokeLinejoin="round" /></svg>
          <Award size={30} className="relative text-white" />
        </span>
      </div>
      <p className="mt-4 font-mono text-[10.5px] text-[#8c88a8]">{tr("Prototype certificate · not an accredited or verified credential")}</p>
    </article>
  );
}

function SharePanel({ pathTitle, cert }: { pathTitle: string; cert: { name: string; date: string; code: string } }) {
  const { tr } = useI18n();
  const [copied, setCopied] = useState(false);
  const url = useSyncExternalStore(subscribe, () => `${window.location.origin}${window.location.pathname}?${certificateQuery(cert)}`, () => "");
  const text = tr("I completed “{path}” on {product}.", { path: pathTitle, product: PRODUCT_NAME });
  const links = useMemo(() => shareLinks({ url, pathTitle, org: PRODUCT_NAME, date: cert.date, code: cert.code, text }), [url, pathTitle, cert, text]);
  const canNativeShare = useSyncExternalStore(subscribe, () => typeof navigator.share === "function", () => false);
  const open = (href: string) => {
    playSfx("tap");
    window.open(href, "_blank", "noopener,noreferrer");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      playSfx("pick");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable: the link stays visible below */
    }
  };
  const small = "press flex h-12 min-w-12 items-center justify-center gap-2 rounded-[14px] border border-line bg-raised px-3.5 text-sm font-semibold text-fg";

  return (
    <section aria-labelledby="share-h" className="mt-6 rounded-[22px] border border-line bg-surface p-5">
      <h2 id="share-h" className="flex items-center gap-2 text-xl font-extrabold tracking-tight">
        <Share2 size={18} aria-hidden className="text-accent" /> {tr("Share your certificate")}
      </h2>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <button type="button" onClick={() => open(links.linkedinProfile)} className="press flex h-14 items-center gap-3 rounded-[14px] bg-[#0a66c2] px-4 text-start font-bold text-white">
          <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-md bg-white font-sans text-[15px] font-extrabold text-[#0a66c2]">in</span>
          <span className="min-w-0">
            <span className="block leading-tight">{tr("Add to LinkedIn profile")}</span>
            <span className="block text-xs font-medium text-white/80">{tr("Licenses & certifications")}</span>
          </span>
        </button>
        <button type="button" onClick={() => open(links.linkedinPost)} className="press flex h-14 items-center gap-3 rounded-[14px] border border-[#0a66c2] bg-[#0a66c2]/15 px-4 text-start font-bold text-fg">
          <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0a66c2] font-sans text-[15px] font-extrabold text-white">in</span>
          <span className="leading-tight">{tr("Post on LinkedIn")}</span>
        </button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button type="button" onClick={() => open(links.x)} className={small} aria-label={tr("Share on X")}>
          <span aria-hidden className="font-sans text-base font-black">𝕏</span>
        </button>
        <button type="button" onClick={() => open(links.facebook)} className={small} aria-label={tr("Share on Facebook")}>
          <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1877f2] font-sans text-[15px] font-black text-white">f</span>
        </button>
        <button type="button" onClick={() => open(links.whatsapp)} className={small} aria-label={tr("Share on WhatsApp")}>
          <MessageCircle size={20} aria-hidden className="text-[#25d366]" />
        </button>
        {canNativeShare && (
          <button type="button" onClick={() => navigator.share({ title: pathTitle, text, url }).catch(() => {})} className={small}>
            <Share2 size={17} aria-hidden /> {tr("More")}
          </button>
        )}
        <button type="button" onClick={copy} className={small} aria-live="polite">
          {copied ? <Check size={17} aria-hidden className="text-ok" /> : <Copy size={17} aria-hidden />} {copied ? tr("Copied") : tr("Copy link")}
        </button>
        <button type="button" onClick={() => window.print()} className={small}>
          <Printer size={17} aria-hidden /> {tr("Save as PDF")}
        </button>
      </div>
      <p className="mt-3 text-xs text-subtle">{tr("LinkedIn opens with the details filled in. Nothing is posted until you confirm there.")}</p>
    </section>
  );
}

/** Before the path is complete: what the certificate needs, as skill rings, and the way back in. */
function Locked({ view }: { view: PathView }) {
  const { tr } = useI18n();
  const { bundle } = view;
  const required = bundle.skills.filter((s) => bundle.requiredSkillIds.includes(s.id));
  const isPreview = bundle.meta.availability === "preview";
  return (
    <section className="mt-6 rounded-[26px] border border-line bg-surface p-6 text-center sm:p-10">
      <span className="relative mx-auto flex h-20 w-20 items-center justify-center" aria-hidden>
        <svg viewBox="0 0 56 56" width="80" height="80" className="absolute inset-0"><path d="M28 3 L50 15.5 V40.5 L28 53 L6 40.5 V15.5 Z" fill="none" stroke="#3a3a46" strokeWidth="2" strokeDasharray="4 3" strokeLinejoin="round" /></svg>
        <Trophy size={30} className="relative text-subtle" />
        <Lock size={16} className="absolute bottom-3 end-3 text-muted" />
      </span>
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{tr("Certificate")}</h1>
      {isPreview ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">{tr("This path is a preview: its full content is not included in this prototype, so it has no certificate yet.")}</p>
      ) : (
        <>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">{tr("Master all {n} skills to earn it.", { n: required.length })}</p>
          <p className="mt-1 font-mono text-sm font-semibold text-accent">{tr("{n}/{m} skills mastered", { n: view.completion.mastered.length, m: required.length })}</p>
          <ul className="mt-6 flex flex-wrap justify-center gap-4" aria-label={tr("Skills")}>
            {required.map((s) => {
              const p = view.progress[s.id];
              return (
                <li key={s.id} className="flex w-24 flex-col items-center gap-1.5">
                  {p && <SkillRing index={bundle.skills.indexOf(s)} progress={p} size={56} />}
                  <span className="text-xs font-semibold leading-tight">{s.name}</span>
                  {p?.status === "mastered" && <span className="inline-flex items-center gap-1 font-mono text-[10.5px] text-ok"><Check size={11} aria-hidden /> {tr("Mastered")}</span>}
                </li>
              );
            })}
          </ul>
          <LinkButton href={`/paths/${bundle.meta.id}`} variant="primary" size="lg" className="mt-6">
            <Play size={16} fill="currentColor" aria-hidden /> {tr("Keep going")}
          </LinkButton>
        </>
      )}
    </section>
  );
}
