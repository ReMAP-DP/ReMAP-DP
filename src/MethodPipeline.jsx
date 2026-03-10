import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

const MODULES = [
  {
    id: 'projection',
    label: 'Multi-View Projection',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m6.115 5.19.319 1.913A6 6 0 0 0 8.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 0 0 2.288-4.042 1.087 1.087 0 0 0-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 0 1-.98-.314l-.295-.295a1.125 1.125 0 0 1 0-1.591l.13-.132a1.125 1.125 0 0 1 1.3-.21l.603.302a.809.809 0 0 0 1.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 0 0 1.528-1.732l.146-.292M6.115 5.19A9 9 0 1 0 17.18 4.64M6.115 5.19A8.965 8.965 0 0 1 12 3c1.929 0 3.716.607 5.18 1.64" />
      </svg>
    ),
    color: 'sky',
    title: 'Workspace Multi-View Projection',
    summary: 'Lifts synchronized RGB-D inputs into a unified point cloud and re-projects via perspective projection.',
    description:
      'Raw RGB-D inputs from multiple cameras are aggregated into a global colored 3D point cloud. This point cloud is then re-projected via multi-view perspective projection to generate pixel-aligned re-projected RGB images and dense coordinate PointMaps. By rendering from fixed canonical viewpoints configured relative to the robot base, the observation space is decoupled from physical sensor poses — ensuring consistency even when cameras are perturbed.',
    keyPoints: [
      'Aggregates multi-camera RGB-D into unified point cloud',
      'Perspective re-projection preserves natural visual priors (unlike orthographic)',
      'Strict pixel-wise alignment: pixel (u,v) in RGB maps 1:1 to metric coordinates in PointMap',
      'Canonical viewpoints decouple policy from camera hardware',
    ],
    equations: [
      { label: 'Re-projected outputs', tex: 'P_{rgbxyz} \\xrightarrow{\\text{project}} (I_{rgb},\\; I_{geo})' },
    ],
  },
  {
    id: 'semantic',
    label: 'Semantic Stream',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
    color: 'violet',
    title: 'Semantic Stream: DINOv2 Foundation Model',
    summary: 'Frozen DINOv2 ViT-S/14 extracts spatial patch-level semantic tokens from RGB.',
    description:
      'The semantic stream leverages the self-supervised DINOv2 (ViT-S/14) foundation model to extract robust visual features. Unlike supervised baselines that prioritize global class separability, DINOv2\'s self-supervised objective produces localized, part-aware features. We discard the global [CLS] token and explicitly extract patch-level features to preserve the spatial topology of the scene. The backbone is frozen during training; a lightweight linear projection maps tokens to the shared fusion dimension.',
    keyPoints: [
      'Frozen DINOv2-ViT-S/14 backbone — preserves pre-trained manifold',
      'Patch-level tokens (N=256 patches, not global [CLS])',
      'Linear projection to shared fusion dimension D_fusion = 256',
      'Resilient to lighting and texture variations',
    ],
    equations: [
      { label: 'Semantic features', tex: 'F_{rgb} = \\text{DINOv2}(I_{rgb}) \\in \\mathbb{R}^{N \\times D_{sem}}' },
      { label: 'Dimensions', tex: 'N = 256,\\quad D_{sem} = 384' },
    ],
  },
  {
    id: 'geometric',
    label: 'Geometric Stream',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    color: 'emerald',
    title: 'Geometric Stream: Projective PointMap ViT',
    summary: 'Custom ViT trained from scratch encodes dense PointMap (x,y,z) coordinates into geometric tokens.',
    description:
      'The geometric stream processes pixel-aligned PointMaps that encode absolute metric coordinates (x, y, z) in three channels — richer than depth maps encoding only relative distance z. A custom Vision Transformer trained from scratch uses patch size P=14 identical to DINOv2, ensuring the resulting token grid spatially aligns with semantic tokens. The PointMap is patchified, flattened, and projected into geometric embeddings before transformer processing.',
    keyPoints: [
      'Dense PointMap encodes absolute (x, y, z) workspace coordinates',
      'Patch size P=14 matches DINOv2 for structural symmetry',
      '4-layer Transformer, embedding dimension D_geo = 128',
      'Linear projection to D_fusion = 256 for cross-modal fusion',
    ],
    equations: [
      { label: 'Geometric features', tex: 'F_{geo} = \\text{ViT}_{pmp}(I_{geo}) \\in \\mathbb{R}^{N \\times D_{geo}}' },
      { label: 'Architecture', tex: 'D_{geo} = 128,\\; L = 4,\\; H = 4' },
    ],
  },
  {
    id: 'fusion',
    label: 'Transformer Fusion',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
    color: 'amber',
    title: 'Multi-Modal Transformer Fusion',
    summary: 'Learnable modality embeddings + cross-modal attention yield a correlated global embedding.',
    description:
      'Both token sequences are projected to a shared dimension D_fusion. Since tokens occupy the same latent space, learnable modality embeddings explicitly signal the attention mechanism to distinguish semantic texture from geometric coordinates. The i-th semantic token corresponds to the exact same physical region as the i-th geometric token — this implicit spatial alignment lets the fusion module focus on feature correlation rather than learning spatial correspondences. A 2-layer transformer with self-attention processes the concatenated sequence, followed by Global Average Pooling to produce the compact observation embedding.',
    keyPoints: [
      'Learnable modality embeddings distinguish RGB vs. geometry tokens',
      'Implicit patch-level alignment via synchronized patch sizes',
      '2-layer Transformer Encoder (d=256, 4 heads, FFN=1024)',
      'Global Average Pooling → compact z_obs for action conditioning',
    ],
    equations: [
      { label: 'Modality-aware fusion', tex: 'S = \\left[\\phi_{rgb}(F_{rgb}) + E_{mod}^{rgb},\\;\\; \\phi_{geo}(F_{geo}) + E_{mod}^{geo}\\right]' },
      { label: 'Observation embedding', tex: 'z_{obs} = \\text{GAP}(\\text{Transformer}(S)) \\in \\mathbb{R}^{D_{fusion}}' },
    ],
  },
  {
    id: 'diffusion',
    label: 'Action Diffusion',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
      </svg>
    ),
    color: 'rose',
    title: 'Conditional Diffusion Action Generation',
    summary: '1D Temporal U-Net DDPM with FiLM conditioning generates precise robot trajectories.',
    description:
      'The action generation process uses a Conditional DDPM with a 1D Temporal U-Net as the noise prediction network. The global observation embedding z_obs is injected via Feature-wise Linear Modulation (FiLM), which applies learned affine transformations at every network layer — modulating action generation from coarse trajectory planning to fine motor control. During training, the network predicts noise residuals via MSE loss. At inference, a squared-cosine beta schedule over K=100 steps ensures high sample quality for precise manipulation.',
    keyPoints: [
      'DDPM with 1D Temporal U-Net noise predictor',
      'FiLM conditioning injects z_obs at every U-Net layer',
      'Predicts action sequences A_t = [a_t, ..., a_{t+H}]',
      'Squared-cosine noise schedule, K=100 inference steps',
    ],
    equations: [
      { label: 'FiLM conditioning', tex: '\\text{FiLM}(h \\mid z_{obs}) = \\gamma(z_{obs}) \\odot h + \\beta(z_{obs})' },
      { label: 'Training loss', tex: '\\mathcal{L} = \\mathbb{E}_{k,\\epsilon,A_0}\\left[\\|\\epsilon - \\epsilon_\\theta(\\sqrt{\\bar{\\alpha}_k}A_0 + \\sqrt{1-\\bar{\\alpha}_k}\\,\\epsilon,\\; k,\\; z_{obs})\\|^2\\right]' },
    ],
  },
]

const COLOR_MAP = {
  sky:     { ring: 'ring-sky-400',     bg: 'bg-sky-50',     text: 'text-sky-700',     dot: 'bg-sky-400',     iconBg: 'bg-sky-100',     border: 'border-sky-200' },
  violet:  { ring: 'ring-violet-400',  bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400',  iconBg: 'bg-violet-100',  border: 'border-violet-200' },
  emerald: { ring: 'ring-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400', iconBg: 'bg-emerald-100', border: 'border-emerald-200' },
  amber:   { ring: 'ring-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   iconBg: 'bg-amber-100',   border: 'border-amber-200' },
  rose:    { ring: 'ring-rose-400',    bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-400',    iconBg: 'bg-rose-100',    border: 'border-rose-200' },
}

function PipelineNode({ mod, isActive, onHover, onClick }) {
  const c = COLOR_MAP[mod.color]
  return (
    <motion.button
      onMouseEnter={() => onHover(mod.id)}
      onClick={() => onClick(mod.id)}
      className={`relative w-full text-left px-4 py-3 rounded-xl border-2 transition-colors duration-200 cursor-pointer
        ${isActive
          ? `${c.bg} ${c.border} ring-2 ${c.ring}`
          : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
      layout
    >
      <div className="flex items-center gap-3">
        <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? c.iconBg : 'bg-gray-100'} ${isActive ? c.text : 'text-gray-500'}`}>
          {mod.icon}
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-semibold leading-tight ${isActive ? c.text : 'text-gray-800'}`}>{mod.label}</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug truncate">{mod.summary}</p>
        </div>
      </div>
    </motion.button>
  )
}

function ConnectorLine({ color, isActive }) {
  const c = COLOR_MAP[color]
  return (
    <div className="flex justify-center py-1">
      <div className={`w-0.5 h-5 rounded-full transition-colors duration-200 ${isActive ? c.dot : 'bg-gray-200'}`} />
    </div>
  )
}

function DetailPanel({ mod }) {
  const c = COLOR_MAP[mod.color]
  return (
    <motion.div
      key={mod.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`rounded-2xl border-2 ${c.border} ${c.bg} p-6 h-full`}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.iconBg} ${c.text}`}>
          {mod.icon}
        </div>
        <h3 className={`text-lg font-bold ${c.text}`}>{mod.title}</h3>
      </div>

      <p className="text-gray-700 text-sm leading-relaxed mb-5">{mod.description}</p>

      {/* Key points */}
      <div className="mb-5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Key Design Choices</h4>
        <ul className="space-y-1.5">
          {mod.keyPoints.map((pt, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
              {pt}
            </li>
          ))}
        </ul>
      </div>

      {/* Equations */}
      {mod.equations.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Formulation</h4>
          <div className="space-y-3">
            {mod.equations.map((eq, i) => (
              <div key={i} className="bg-white/70 rounded-lg px-4 py-3 border border-white">
                <p className="text-xs text-gray-500 mb-1">{eq.label}</p>
                <div className="overflow-x-auto">
                  <BlockMath math={eq.tex} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function MethodPipeline() {
  const [activeId, setActiveId] = useState(MODULES[0].id)
  const activeMod = MODULES.find((m) => m.id === activeId)

  const projection = MODULES.find((m) => m.id === 'projection')
  const semantic = MODULES.find((m) => m.id === 'semantic')
  const geometric = MODULES.find((m) => m.id === 'geometric')
  const fusion = MODULES.find((m) => m.id === 'fusion')
  const diffusion = MODULES.find((m) => m.id === 'diffusion')

  return (
    <section id="method" className="py-16">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 pb-2 border-b border-gray-200">
          Method Pipeline
        </h2>
        <p className="text-gray-500 text-sm mb-4">
          Hover or tap a module to explore the ReMAP-DP architecture.
        </p>

        {/* Overview figure */}
        <div className="mb-10">
          <img
            src={`${import.meta.env.BASE_URL}Method.png`}
            alt="Overall architecture of ReMAP-DP"
            className="w-full rounded-xl border border-gray-200 shadow-sm"
          />
          <p className="text-xs text-gray-500 mt-2 text-center">
            Figure 2: Overall architecture of ReMAP-DP. (1) Multi-view projection generates aligned RGB and PointMaps. (2) Dual-stream encoder with transformer fusion. (3) Diffusion-based action generation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Pipeline flowchart */}
          <div className="lg:col-span-2 flex flex-col">
            {/* Step 1: Projection */}
            <PipelineNode mod={projection} isActive={activeId === 'projection'} onHover={setActiveId} onClick={setActiveId} />

            {/* Connector: projection → dual streams */}
            <div className="flex justify-center py-1">
              <div className={`w-0.5 h-5 rounded-full transition-colors duration-200 ${activeId === 'projection' || activeId === 'semantic' || activeId === 'geometric' ? 'bg-sky-400' : 'bg-gray-200'}`} />
            </div>

            {/* Step 2 & 3: Parallel dual streams */}
            <div className="grid grid-cols-2 gap-3">
              <PipelineNode mod={semantic} isActive={activeId === 'semantic'} onHover={setActiveId} onClick={setActiveId} />
              <PipelineNode mod={geometric} isActive={activeId === 'geometric'} onHover={setActiveId} onClick={setActiveId} />
            </div>

            {/* Connector: dual streams → fusion (two lines merging) */}
            <div className="flex justify-center py-1">
              <svg className="w-full h-6" viewBox="0 0 200 24" fill="none" preserveAspectRatio="xMidYMid meet">
                <path
                  d="M 50 0 L 50 8 Q 50 12 54 14 L 100 20"
                  stroke={activeId === 'semantic' || activeId === 'fusion' ? '#a78bfa' : '#e5e7eb'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  className="transition-colors duration-200"
                />
                <path
                  d="M 150 0 L 150 8 Q 150 12 146 14 L 100 20"
                  stroke={activeId === 'geometric' || activeId === 'fusion' ? '#34d399' : '#e5e7eb'}
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                  className="transition-colors duration-200"
                />
              </svg>
            </div>

            {/* Step 4: Fusion */}
            <PipelineNode mod={fusion} isActive={activeId === 'fusion'} onHover={setActiveId} onClick={setActiveId} />

            {/* Connector: fusion → diffusion */}
            <ConnectorLine color="amber" isActive={activeId === 'fusion' || activeId === 'diffusion'} />

            {/* Step 5: Diffusion */}
            <PipelineNode mod={diffusion} isActive={activeId === 'diffusion'} onHover={setActiveId} onClick={setActiveId} />
          </div>

          {/* Right: Detail panel */}
          <div className="lg:col-span-3 min-h-[480px]">
            <AnimatePresence mode="wait">
              {activeMod && <DetailPanel mod={activeMod} />}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
