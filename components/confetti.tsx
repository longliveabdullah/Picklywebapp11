"use client"

import { useMemo } from "react"

const ConfettiPiece = ({ style }: { style: React.CSSProperties }) => {
  return <div className="absolute w-2 h-4" style={style} />
}

export const Confetti = () => {
  const confetti = useMemo(() => {
    const pieces = []
    const colors = ["#ef4444", "#f97316", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef"]
    for (let i = 0; i < 100; i++) {
      pieces.push({
        style: {
          left: `${Math.random() * 100}%`,
          top: `${-20 - Math.random() * 100}%`,
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          transform: `rotate(${Math.random() * 360}deg)`,
          animation: `fall ${4 + Math.random() * 2}s ${Math.random() * 2}s linear forwards`,
        },
      })
    }
    return pieces
  }, [])

  return (
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-50">
      {confetti.map((piece, index) => (
        <ConfettiPiece key={index} style={piece.style} />
      ))}
      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(120vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
