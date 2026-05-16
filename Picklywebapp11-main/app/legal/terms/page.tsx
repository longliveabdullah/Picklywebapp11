"use client"

import Link from "next/link"
import { LegalPageShell } from "@/components/legal-page-shell"
import { LEGAL_LAST_UPDATED, TERMS_SECTIONS } from "@/lib/legal-static-copy"

const ACCENT = "#697254"

export default function TermsOfServicePage() {
  return (
    <LegalPageShell title="Terms of Service">
      <p className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-[13px] leading-relaxed text-amber-950/90">
        This document is a <strong>starting template</strong> for your product. It is <strong>not</strong> legal advice.
        Have qualified counsel review and adapt it for your company, jurisdictions, and data practices.
      </p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#92735C]/70">Last updated {LEGAL_LAST_UPDATED}</p>

      <div className="mt-6 space-y-8">
        {TERMS_SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="text-base font-bold text-[#2D2D2D]">{section.heading}</h2>
            <div className="mt-2 space-y-3 text-[14px] leading-relaxed text-[#4A4A4A]">
              {section.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-center text-[13px] text-[#92735C]">
        See also{" "}
        <Link href="/legal/privacy" className="font-semibold hover:underline" style={{ color: ACCENT }}>
          Privacy Policy
        </Link>
        .
      </p>
    </LegalPageShell>
  )
}
