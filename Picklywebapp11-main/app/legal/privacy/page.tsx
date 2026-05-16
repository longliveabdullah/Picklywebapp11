"use client"

import Link from "next/link"
import { LegalPageShell } from "@/components/legal-page-shell"
import { LEGAL_LAST_UPDATED, PRIVACY_SECTIONS } from "@/lib/legal-static-copy"

const ACCENT = "#697254"

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy">
      <p className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-[13px] leading-relaxed text-amber-950/90">
        This policy is a <strong>draft outline</strong>. Align it with your real data flows, subprocessors, regions,
        and retention—then have counsel finalize it.
      </p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#92735C]/70">Last updated {LEGAL_LAST_UPDATED}</p>

      <div className="mt-6 space-y-8">
        {PRIVACY_SECTIONS.map((section) => (
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
        <Link href="/legal/terms" className="font-semibold hover:underline" style={{ color: ACCENT }}>
          Terms of Service
        </Link>
        .
      </p>
    </LegalPageShell>
  )
}
