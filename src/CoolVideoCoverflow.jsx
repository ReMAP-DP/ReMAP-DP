import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, animate } from 'framer-motion'

/* ================================================================
   VIDEO DATA
   ================================================================ */
const VIDEO_FILES = [
  'BeatBlockHammer.mp4',
  'BlocksRankingRGB.mp4',
  'ClickBell.mp4',
  'TurnSwitch.mp4',
  'PlaceContainerPlate.mp4',
  'PlaceEmptyCup.mp4',
  'StackBlocksTwo.mp4',
  'StackBlocksThree.mp4',
  'StackBowlsThree.mp4',
  'StackBowlsTwo.mp4',
]

function parseTitle(filename) {
  const name = filename.replace(/\.mp4$/i, '')
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
}

/* ================================================================
   CONFIG
   ================================================================ */
const CARD_W = 420        // card width in px
const CARD_GAP = 60       // space between card centers beyond CARD_W
const SPRING = { type: 'spring', stiffness: 260, damping: 28 }

function getCardTransform(offset) {
  const abs = Math.abs(offset)
  const sign = Math.sign(offset)

  if (abs < 0.01) {
    return { scale: 1.08, rotateY: 0, translateZ: 0, opacity: 1 }
  }

  return {
    scale: Math.max(0.55, 1.08 - abs * 0.16),
    rotateY: -sign * Math.min(abs * 28, 50),
    translateZ: -abs * 120,
    opacity: Math.max(0.25, 1 - abs * 0.25),
  }
}

/* ================================================================
   COMPONENT
   ================================================================ */
export default function CoolVideoCoverflow() {
  const [focused, setFocused] = useState(0)
  const videoRefs = useRef([])
  const containerRef = useRef(null)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragStartFocused = useRef(0)
  const count = VIDEO_FILES.length
  const base = import.meta.env.BASE_URL

  const goTo = useCallback(
    (i) => setFocused(Math.max(0, Math.min(count - 1, i))),
    [count],
  )

  // Video playback: only focused plays
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return
      if (i === focused) {
        v.play().catch(() => {})
      } else {
        v.pause()
        v.currentTime = 0
      }
    })
  }, [focused])

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') goTo(focused - 1)
      if (e.key === 'ArrowRight') goTo(focused + 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [focused, goTo])

  // Drag handlers (pointer events for touch + mouse)
  const onPointerDown = useCallback(
    (e) => {
      isDragging.current = false
      dragStartX.current = e.clientX
      dragStartFocused.current = focused
      containerRef.current?.setPointerCapture(e.pointerId)
    },
    [focused],
  )

  const onPointerMove = useCallback((e) => {
    const dx = e.clientX - dragStartX.current
    if (Math.abs(dx) > 8) isDragging.current = true
  }, [])

  const onPointerUp = useCallback(
    (e) => {
      const dx = e.clientX - dragStartX.current
      containerRef.current?.releasePointerCapture(e.pointerId)

      if (Math.abs(dx) < 8) return // was a click, not drag

      const cardStep = CARD_W * 0.45 // px dragged to shift one card
      const shift = Math.round(-dx / cardStep)
      goTo(dragStartFocused.current + shift)
    },
    [goTo],
  )

  const handleCardClick = useCallback(
    (i) => {
      if (!isDragging.current) goTo(i)
    },
    [goTo],
  )

  return (
    <section id="simulation" className="relative py-20 sm:py-28 bg-neutral-950 overflow-hidden select-none">
      {/* Heading */}
      <div className="max-w-5xl mx-auto px-6 mb-12 sm:mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Simulation Tasks
        </h2>
        <p className="text-neutral-400 text-sm sm:text-base">
          10 manipulation tasks from the RoboTwin 2.0 benchmark — drag or click to explore.
        </p>
      </div>

      {/* Viewport */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden touch-pan-y"
        style={{ height: 340 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Gradient edges */}
        <div className="absolute inset-y-0 left-0 w-20 sm:w-36 bg-gradient-to-r from-neutral-950 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-20 sm:w-36 bg-gradient-to-l from-neutral-950 to-transparent z-20 pointer-events-none" />

        {/* Arrow buttons */}
        <ArrowBtn dir="left" onClick={() => goTo(focused - 1)} disabled={focused === 0} />
        <ArrowBtn dir="right" onClick={() => goTo(focused + 1)} disabled={focused === count - 1} />

        {/* Cards — each absolutely centered, offset by (index - focused) */}
        <div className="relative w-full h-full" style={{ perspective: 1400 }}>
          {VIDEO_FILES.map((file, i) => {
            const offset = i - focused
            const t = getCardTransform(offset)
            const x = offset * (CARD_W + CARD_GAP)
            const zIdx = 100 - Math.round(Math.abs(offset) * 10)

            return (
              <motion.div
                key={file}
                className="absolute top-0 cursor-pointer"
                style={{
                  width: CARD_W,
                  left: '50%',
                  marginLeft: -(CARD_W / 2),
                  transformStyle: 'preserve-3d',
                  zIndex: zIdx,
                }}
                animate={{
                  x,
                  scale: t.scale,
                  rotateY: t.rotateY,
                  opacity: t.opacity,
                }}
                transition={SPRING}
                onClick={() => handleCardClick(i)}
              >
                <div
                  className={`rounded-2xl overflow-hidden transition-shadow duration-500
                    ${Math.abs(offset) < 0.5
                      ? 'shadow-[0_16px_50px_-8px_rgba(59,130,246,0.35)]'
                      : 'shadow-lg shadow-black/50'
                    }`}
                >
                  <div className="aspect-video bg-neutral-900">
                    <video
                      ref={(el) => { videoRefs.current[i] = el }}
                      className="w-full h-full object-cover"
                      src={`${base}videos/${file}`}
                      preload="metadata"
                      muted
                      loop
                      playsInline
                    />
                  </div>
                </div>

                {/* Title */}
                <motion.p
                  className="text-center mt-3 text-sm font-medium text-white/90 tracking-wide pointer-events-none"
                  animate={{
                    opacity: Math.abs(offset) < 0.5 ? 1 : 0,
                    y: Math.abs(offset) < 0.5 ? 0 : 8,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {parseTitle(file)}
                </motion.p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-10">
        {VIDEO_FILES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 cursor-pointer
              ${i === focused ? 'w-6 bg-blue-400' : 'w-2 bg-white/25 hover:bg-white/50'}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

function ArrowBtn({ dir, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`absolute top-1/2 -translate-y-1/2 z-30
                  w-11 h-11 rounded-full flex items-center justify-center
                  bg-white/10 backdrop-blur-md border border-white/20
                  text-white/80 hover:bg-white/20 hover:text-white
                  transition-all duration-200 cursor-pointer
                  disabled:opacity-20 disabled:cursor-default
                  ${dir === 'left' ? 'left-3 sm:left-6' : 'right-3 sm:right-6'}`}
      aria-label={dir === 'left' ? 'Previous' : 'Next'}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        {dir === 'left'
          ? <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          : <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        }
      </svg>
    </button>
  )
}
