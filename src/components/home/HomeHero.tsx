import { Footprints } from 'lucide-react'

export function HomeHero() {
  return (
    <section className="flex h-40 w-full flex-col items-center justify-center gap-3 rounded-lg bg-brand-primary-soft text-center">
      <Footprints
        size={56}
        strokeWidth={2}
        className="text-brand-primary"
        aria-hidden
      />
      <div className="flex flex-col gap-1">
        <h1 className="text-[length:var(--text-body-1)] font-semibold leading-normal text-ink-900">
          산책길에서 빙고를 찾아요
        </h1>
        <p className="text-[length:var(--text-caption)] leading-normal text-ink-700">
          오늘 만난 사물로 빙고판을 채워보세요
        </p>
      </div>
    </section>
  )
}
