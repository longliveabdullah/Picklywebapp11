"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import ProtectedRoute from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { useDisplayName } from "@/hooks/use-display-name"

const ease = [0.22, 1, 0.36, 1] as const

interface ChatMessage {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
}

const suggestedPrompts = [
  { icon: "🧴", text: "What ingredients should I avoid for sensitive skin?" },
  { icon: "✨", text: "Build me a simple nighttime skincare routine" },
  { icon: "🔬", text: "Is niacinamide safe to use with vitamin C?" },
  { icon: "💆", text: "How do I know my skin type?" },
]

export default function AssistantPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { displayName: profileDisplayName } = useDisplayName(user?.id, user?.email)
  const displayName = profileDisplayName || "there"

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
    }
  }, [inputValue])

  const sendMessage = async (text: string) => {
    if (!text.trim() || isSending) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: text.trim(),
      isUser: true,
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInputValue("")
    setIsSending(true)
    setIsTyping(true)

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: "",
      isUser: false,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      })

      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let done = false
      let fullResponse = ""

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunk = decoder.decode(value, { stream: true })
        fullResponse += chunk
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessage.id ? { ...msg, content: fullResponse } : msg
          )
        )
      }
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: "Sorry, I'm having trouble right now. Please try again in a moment." }
            : msg
        )
      )
    } finally {
      setIsTyping(false)
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  const hasMessages = messages.length > 0

  return (
    <ProtectedRoute requireOnboarding>
      <div className="flex min-h-screen flex-col bg-[#F5EFE6]">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center justify-between px-5 pb-3 pt-5"
        >
          <button
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#92735C]/10"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#697254]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 014 4v2H8V6a4 4 0 014-4z" />
                <rect x="5" y="8" width="14" height="13" rx="2" />
                <circle cx="9.5" cy="14" r="1.5" />
                <circle cx="14.5" cy="14" r="1.5" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-[#2D2D2D]">Pickly Assistant</h1>
          </div>

          <button
            onClick={() => { setMessages([]); setInputValue("") }}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[#92735C]/10"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
          </button>
        </motion.div>

        {/* Chat Body */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 pb-4" style={{ scrollbarWidth: "none" }}>
            <AnimatePresence mode="wait">
              {!hasMessages ? (
                /* Empty State */
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5, ease }}
                  className="flex flex-col items-center pt-12"
                >
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#697254]/10">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#697254" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a4 4 0 014 4v2H8V6a4 4 0 014-4z" />
                      <rect x="5" y="8" width="14" height="13" rx="2" />
                      <circle cx="9.5" cy="14" r="1.5" />
                      <circle cx="14.5" cy="14" r="1.5" />
                      <path d="M9.5 18.5c1 1 4 1 5 0" />
                    </svg>
                  </div>

                  <h2 className="mb-1 text-xl font-bold text-[#2D2D2D]">
                    Hi, {displayName}!
                  </h2>
                  <p className="mb-8 max-w-[260px] text-center text-[13px] leading-relaxed text-[#92735C]/70">
                    I&apos;m your personal beauty assistant. Ask me anything about ingredients, routines, or products.
                  </p>

                  <div className="w-full space-y-2.5">
                    {suggestedPrompts.map((prompt, i) => (
                      <motion.button
                        key={prompt.text}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: 0.15 + i * 0.07, ease }}
                        onClick={() => sendMessage(prompt.text)}
                        className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
                      >
                        <span className="text-xl">{prompt.icon}</span>
                        <span className="text-[13px] font-medium leading-snug text-[#2D2D2D]">
                          {prompt.text}
                        </span>
                        <svg className="ml-auto shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92735C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                /* Messages */
                <motion.div
                  key="messages"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3 pt-3"
                >
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i === messages.length - 1 ? 0.05 : 0 }}
                      className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!msg.isUser && (
                        <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#697254]">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a4 4 0 014 4v2H8V6a4 4 0 014-4z" />
                            <rect x="5" y="8" width="14" height="13" rx="2" />
                          </svg>
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.isUser
                            ? "rounded-br-md bg-[#697254] text-[#EFE5D8]"
                            : "rounded-bl-md bg-white text-[#2D2D2D] shadow-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
                          {msg.content}
                          {!msg.isUser && !msg.content && isTyping && (
                            <span className="inline-flex gap-1">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#697254]/40" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#697254]/40" style={{ animationDelay: "0.15s" }} />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#697254]/40" style={{ animationDelay: "0.3s" }} />
                            </span>
                          )}
                        </p>
                        <p className={`mt-1.5 text-[10px] ${msg.isUser ? "text-[#EFE5D8]/50" : "text-[#92735C]/40"}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease }}
            className="border-t border-[#E8E2D8] bg-[#F5EFE6] px-5 pb-24 pt-3"
          >
            <div className="flex items-end gap-2.5">
              <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Pickly anything..."
                  disabled={isSending}
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-[#DBD0C4] bg-white px-4 py-3 text-[13px] text-[#2D2D2D] placeholder-[#92735C]/40 focus:border-[#697254] focus:outline-none focus:ring-2 focus:ring-[#697254]/15 disabled:opacity-50"
                />
              </div>

              <button
                onClick={() => sendMessage(inputValue)}
                disabled={!inputValue.trim() || isSending}
                className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl transition-all ${
                  inputValue.trim() && !isSending
                    ? "bg-[#697254] shadow-md hover:shadow-lg"
                    : "bg-[#DBD0C4]/50"
                }`}
              >
                {isSending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={inputValue.trim() ? "white" : "#92735C"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
