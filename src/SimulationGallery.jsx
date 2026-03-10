import { useRef, useCallback } from 'react'

/* ================================================================
   CONFIG — toggle hover-to-play behavior
   Set to false to disable hover interaction (videos stay paused).
   ================================================================ */
const HOVER_TO_PLAY = true

/* ================================================================
   VIDEO DATA — filenames in public/videos/
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

/**
 * Parse a PascalCase filename into a clean title.
 * e.g. "StackBlocksTwo.mp4" -> "Stack Blocks Two"
 *      "BlocksRankingRGB.mp4" -> "Blocks Ranking RGB"
 */
function parseTitle(filename) {
  const name = filename.replace(/\.mp4$/i, '')
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2')   // camelCase boundary
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // consecutive caps
}

function VideoCard({ filename }) {
  const videoRef = useRef(null)

  const handleMouseEnter = useCallback(() => {
    if (!HOVER_TO_PLAY) return
    const video = videoRef.current
    if (video) {
      video.currentTime = 0
      video.play().catch(() => {})
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (!HOVER_TO_PLAY) return
    const video = videoRef.current
    if (video) {
      video.pause()
      video.currentTime = 0
    }
  }, [])

  const base = import.meta.env.BASE_URL
  const title = parseTitle(filename)

  return (
    <div
      className="group bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-video overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={`${base}videos/${filename}`}
          preload="metadata"
          muted
          loop
          playsInline
        />
        {/* Play icon overlay — fades out on hover */}
        {HOVER_TO_PLAY && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-transparent transition-all duration-300 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center group-hover:opacity-0 group-hover:scale-110 transition-all duration-300">
              <svg className="w-5 h-5 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
      <div className="px-4 py-3">
        <h3 className="text-sm font-medium text-gray-800 text-center">{title}</h3>
      </div>
    </div>
  )
}

export default function SimulationGallery() {
  return (
    <section id="simulation" className="py-16">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 pb-2 border-b border-gray-200">
          Simulation Tasks
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          Visualization of 10 manipulation tasks from the RoboTwin 2.0 benchmark.
          {HOVER_TO_PLAY && ' Hover over a card to preview.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {VIDEO_FILES.map((file) => (
            <VideoCard key={file} filename={file} />
          ))}
        </div>
      </div>
    </section>
  )
}
