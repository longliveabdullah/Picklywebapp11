"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import {
  buildProfileTags,
  calculateCompatibility,
  circleUsers,
  hairTypeLabel,
  matchesQuery,
  relevantReviews,
  suggestedSearchTags,
} from "@/lib/pickly-circles-data"

type DbCircle = { id: string; slug: string; name: string; description: string | null; accent: string }

const ease = [0.22, 1, 0.36, 1] as const

function UserMatchCard({
  name,
  username,
  headline,
  tags,
  score,
  reasons,
}: {
  name: string
  username: string
  headline: string
  tags: string[]
  score: number
  reasons: string[]
}) {
  return (
    <div className="w-[235px] shrink-0 rounded-3xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#697254] text-sm font-bold text-[#EFE5D8]">
            {name[0]}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-bold text-[#2D2D2D]">{name}</p>
            <p className="truncate text-[11px] text-[#92735C]/55">{username}</p>
          </div>
        </div>

        <div className="rounded-full bg-[#A7AD89]/15 px-2.5 py-1 text-[10px] font-bold text-[#697254]">
          {score}% match
        </div>
      </div>

      <p className="mb-3 text-[12px] leading-relaxed text-[#92735C]/75">{headline}</p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[#F5EFE6] px-2.5 py-1 text-[10px] font-semibold text-[#92735C]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="rounded-2xl bg-[#F5EFE6] p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#697254]/65">Why you match</p>
        <div className="mt-2 space-y-1.5">
          {reasons.map((reason) => (
            <p key={reason} className="text-[11px] leading-relaxed text-[#2D2D2D]/78">
              {reason}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

function CircleCard({
  name,
  description,
  tags,
  memberCount,
  activityLabel,
  accent,
}: {
  name: string
  description: string
  tags: string[]
  memberCount: string
  activityLabel: string
  accent: string
}) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${accent}18` }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <div className="rounded-full bg-[#F5EFE6] px-2.5 py-1 text-[10px] font-bold text-[#92735C]">
          {memberCount}
        </div>
      </div>

      <p className="text-[14px] font-bold text-[#2D2D2D]">{name}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-[#92735C]/72">{description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag} className="rounded-full bg-[#F5EFE6] px-2.5 py-1 text-[10px] font-semibold text-[#92735C]">
            {tag}
          </span>
        ))}
      </div>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#697254]/55">{activityLabel}</p>
    </div>
  )
}

function RelevantReviewCard({
  author,
  productName,
  quote,
  relevanceLine,
}: {
  author: string
  productName: string
  quote: string
  relevanceLine: string
}) {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-[#2D2D2D]">{productName}</p>
          <p className="text-[11px] text-[#92735C]/55">Reviewed by {author}</p>
        </div>

        <div className="rounded-full bg-[#A7AD89]/15 px-2.5 py-1 text-[10px] font-bold text-[#697254]">
          Relevant
        </div>
      </div>

      <p className="text-[12px] italic leading-relaxed text-[#2D2D2D]/82">“{quote}”</p>
      <p className="mt-3 text-[11px] leading-relaxed text-[#92735C]/70">{relevanceLine}</p>
    </div>
  )
}

export default function CommunityPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState("")
  const [dbCircles, setDbCircles] = useState<DbCircle[]>([])

  useEffect(() => {
    fetch("/api/social/circles")
      .then((r) => r.json())
      .then((d) => { if (d.circles) setDbCircles(d.circles) })
      .catch(() => {})
  }, [])

  const currentProfile = user?.profile ?? {}
  const currentTags = useMemo(() => buildProfileTags(currentProfile), [currentProfile])

  const matchedUsers = useMemo(
    () =>
      circleUsers
        .map((candidate) => ({
          ...candidate,
          compatibility: calculateCompatibility(currentProfile, candidate),
          tags: [
            candidate.skinType ? `${candidate.skinType[0].toUpperCase()}${candidate.skinType.slice(1)} Skin` : null,
            candidate.hairType ? hairTypeLabel(candidate.hairType) : null,
            ...candidate.extraTags,
          ].filter(Boolean) as string[],
        }))
        .sort((a, b) => b.compatibility.score - a.compatibility.score),
    [currentProfile],
  )

  const filteredUsers = useMemo(
    () =>
      matchedUsers.filter((candidate) =>
        [
          candidate.name,
          candidate.username,
          candidate.headline,
          ...candidate.tags,
          ...candidate.favoriteProducts,
          ...candidate.compatibility.reasons,
        ].some((value) => matchesQuery(value, query)),
      ),
    [matchedUsers, query],
  )

  const filteredCircles = useMemo(
    () =>
      dbCircles.filter((circle) =>
        [circle.name, circle.description ?? ""].some((value) => matchesQuery(value, query)),
      ),
    [dbCircles, query],
  )

  const filteredReviews = useMemo(
    () =>
      relevantReviews.filter((review) => {
        const author = matchedUsers.find((candidate) => candidate.id === review.authorId)?.name ?? "Pickly Match"
        return [author, review.productName, review.quote, review.relevanceLine].some((value) => matchesQuery(value, query))
      }),
    [matchedUsers, query],
  )

  const hasQuery = query.trim().length > 0

  return (
    <ProtectedRoute requireOnboarding>
      <div className="min-h-screen bg-[#F5EFE6] pb-24">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="px-5 pb-3 pt-5"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#697254]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EFE5D8" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87" />
                <path d="M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2D2D2D]">Pickly Circles</h1>
              <p className="text-[12px] text-[#92735C]/65">
                Community powered by compatibility, not noise.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="px-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06, ease }}
            className="relative"
          >
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#92735C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search people, circles, or profile tags"
              className="w-full rounded-2xl border-0 bg-white py-3 pl-10 pr-10 text-sm text-[#2D2D2D] shadow-sm outline-none placeholder:text-[#92735C]/45 focus:ring-2 focus:ring-[#A7AD89]/35"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#92735C]/60"
              >
                Clear
              </button>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.12, ease }}
            className="mt-3 flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {suggestedSearchTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setQuery(tag)}
                className="rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#92735C] shadow-sm"
              >
                {tag}
              </button>
            ))}
          </motion.div>
        </div>

        {!hasQuery ? (
          <div className="space-y-5 px-5 pt-5">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.16, ease }}
              className="relative overflow-hidden rounded-3xl bg-[#697254] p-5 text-[#EFE5D8] shadow-md"
            >
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#A7AD89]/18" />
              <div className="absolute -bottom-10 left-[-12px] h-24 w-24 rounded-full bg-white/6" />

              <div className="relative">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#A7AD89]">How Pickly Circles works</p>
                <p className="mt-2 text-xl font-bold">Find people and routines that actually match you.</p>
                <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-[#EFE5D8]/78">
                  Reviews feel more trustworthy when they come from people with similar skin, hair, values, and product habits.
                </p>

                {currentTags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentTags.map((tag) => (
                      <span key={tag} className="rounded-full bg-white/12 px-3 py-1.5 text-[10px] font-semibold text-[#EFE5D8]/86">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.22, ease }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-[#2D2D2D]">People Similar to You</p>
                <span className="text-[11px] font-semibold text-[#697254]/60">Best matches</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {matchedUsers.map((candidate) => (
                  <UserMatchCard
                    key={candidate.id}
                    name={candidate.name}
                    username={candidate.username}
                    headline={candidate.headline}
                    tags={candidate.tags}
                    score={candidate.compatibility.score}
                    reasons={candidate.compatibility.reasons}
                  />
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.28, ease }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-[#2D2D2D]">Circles for You</p>
                <span className="text-[11px] font-semibold text-[#92735C]/60">Identity-based groups</span>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {dbCircles.map((circle) => (
                  <CircleCard
                    key={circle.id}
                    name={circle.name}
                    description={circle.description ?? ""}
                    tags={[]}
                    memberCount="—"
                    activityLabel="Open circle"
                    accent={circle.accent}
                  />
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.34, ease }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-base font-bold text-[#2D2D2D]">Reviews from Matching People</p>
                <span className="text-[11px] font-semibold text-[#92735C]/60">More relevant trust</span>
              </div>
              <div className="space-y-3">
                {relevantReviews.map((review) => {
                  const author = matchedUsers.find((candidate) => candidate.id === review.authorId)?.name ?? "Pickly Match"
                  return (
                    <RelevantReviewCard
                      key={review.id}
                      author={author}
                      productName={review.productName}
                      quote={review.quote}
                      relevanceLine={review.relevanceLine}
                    />
                  )
                })}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-5 px-5 pt-5">
            <div className="rounded-3xl bg-white p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#92735C]/50">Search Results</p>
              <p className="mt-1 text-sm text-[#2D2D2D]">
                Results for <span className="font-bold">“{query}”</span>
              </p>
            </div>

            {filteredUsers.length > 0 && (
              <div className="space-y-3">
                <p className="text-base font-bold text-[#2D2D2D]">People</p>
                <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                  {filteredUsers.map((candidate) => (
                    <UserMatchCard
                      key={candidate.id}
                      name={candidate.name}
                      username={candidate.username}
                      headline={candidate.headline}
                      tags={candidate.tags}
                      score={candidate.compatibility.score}
                      reasons={candidate.compatibility.reasons}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredCircles.length > 0 && (
              <div className="space-y-3">
                <p className="text-base font-bold text-[#2D2D2D]">Circles</p>
                <div className="grid grid-cols-1 gap-3">
                  {filteredCircles.map((circle) => (
                    <CircleCard
                      key={circle.id}
                      name={circle.name}
                      description={circle.description ?? ""}
                      tags={[]}
                      memberCount="—"
                      activityLabel="Open circle"
                      accent={circle.accent}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredReviews.length > 0 && (
              <div className="space-y-3">
                <p className="text-base font-bold text-[#2D2D2D]">Relevant Reviews</p>
                <div className="space-y-3">
                  {filteredReviews.map((review) => {
                    const author = matchedUsers.find((candidate) => candidate.id === review.authorId)?.name ?? "Pickly Match"
                    return (
                      <RelevantReviewCard
                        key={review.id}
                        author={author}
                        productName={review.productName}
                        quote={review.quote}
                        relevanceLine={review.relevanceLine}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {filteredUsers.length === 0 && filteredCircles.length === 0 && filteredReviews.length === 0 && (
              <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F5EFE6]">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#92735C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <p className="mt-4 text-sm font-bold text-[#2D2D2D]">No matches found</p>
                <p className="mt-1 text-[12px] leading-relaxed text-[#92735C]/70">
                  Try searching with profile tags like skin type, hair type, budget, or fragrance preferences.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
