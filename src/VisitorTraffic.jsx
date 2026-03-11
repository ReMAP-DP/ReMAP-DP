import { useEffect, useRef } from 'react'

export default function VisitorTraffic() {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.id = 'mapmyvisitors'
    script.src = '//mapmyvisitors.com/map.js?d=kwIySm--htM3yLD46HlP_e64uq31snWQ1n7ABzeUBHU&cl=ffffff&w=a'
    containerRef.current.appendChild(script)

    return () => {
      // Clean up on unmount
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [])

  return (
    <section className="py-12 bg-neutral-50">
      <div className="max-w-3xl mx-auto px-6">
        <p className="text-center text-xs uppercase tracking-wider text-neutral-400 font-medium mb-6">
          Visitor Traffic
        </p>
        <div className="rounded-xl shadow-sm border border-neutral-200 bg-white p-4 sm:p-6 overflow-hidden">
          <div ref={containerRef} className="flex justify-center [&>img]:max-w-full [&>img]:h-auto" />
        </div>
      </div>
    </section>
  )
}
