import { Camera, Lock, Menu, X } from 'lucide-react'
import { notFound } from 'next/navigation'
import {
  Badge,
  Button,
  IconButton,
  ProgressBar,
  Tag,
  TextField,
} from '@/components/ui'
import { getCategoryVisual, getSwatchVisual } from '@/lib/bingo/cellVisual'
import { DynamicIcon } from '@/lib/icons/dynamic-icon'
import type { Category } from '@/types/cell'

export default function DevUiPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <main className="min-h-screen bg-canvas px-4 py-8 text-ink-900">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-display-1 font-bold leading-tight">
            산책빙고 · Atoms
          </h1>
          <p className="text-body-2 leading-normal text-ink-500">
            Buttons · Tags · Badges · TextField · ProgressBar · IconButton
          </p>
        </header>

        <section className="rounded-lg bg-paper px-8 py-6">
          <h2 className="text-heading-1 font-bold leading-tight">Buttons</h2>
          <p className="mt-2 text-body-2 leading-normal text-ink-500">
            Primary / Secondary / Tertiary / Destructive / Disabled (default
            size + large)
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button>산책 시작</Button>
            <Button variant="secondary">다시 도전</Button>
            <Button variant="tertiary">홈으로</Button>
            <Button variant="destructive">사진 삭제</Button>
          </div>
          <p className="mt-3 text-caption font-medium leading-normal text-ink-500">
            기본 사이즈 (md, 48h)
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button size="lg">산책 시작하기</Button>
            <Button size="lg" disabled>
              닉네임을 입력해주세요
            </Button>
          </div>
          <p className="mt-3 text-caption font-medium leading-normal text-ink-500">
            Large CTA (lg, 56h) — sticky bottom
          </p>
        </section>

        <section className="rounded-lg bg-paper px-8 py-6">
          <h2 className="text-heading-1 font-bold leading-tight">
            Icon Buttons · 44×44 tap target
          </h2>
          <div className="mt-4 flex items-center gap-4">
            <IconButton icon={Camera} aria-label="카메라" />
            <IconButton icon={Menu} variant="ghost" aria-label="메뉴" />
            <IconButton icon={X} variant="close" aria-label="닫기" />
          </div>
        </section>

        <section className="rounded-lg bg-paper px-8 py-6">
          <h2 className="text-heading-1 font-bold leading-tight">
            Tags · Chip · 4/10 padding · pill radius
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Tag>5×5</Tag>
            <Tag variant="brand">사진 모드</Tag>
            <Tag variant="noPhoto" icon={Lock}>
              사람
            </Tag>
          </div>
        </section>

        <section className="rounded-lg bg-paper px-8 py-6">
          <h2 className="text-heading-1 font-bold leading-tight">
            Badges · 24px · 사진 완료 칸 우상단
          </h2>
          <div className="mt-4 flex items-center gap-4">
            <Badge label="완료" />
          </div>
        </section>

        <section className="rounded-lg bg-paper px-8 py-6">
          <h2 className="text-heading-1 font-bold leading-tight">
            TextField · Default / Focus · counter
          </h2>
          <div className="mt-4 flex flex-col gap-8 md:flex-row">
            <div className="w-full max-w-80">
              <TextField
                id="nickname-default"
                label="닉네임"
                placeholder="예) 산책요정 주연"
                value=""
                maxLength={10}
                showCounter
                hint="한글·영문·이모지 1개 가능"
                readOnly
              />
            </div>
            <div className="w-full max-w-80">
              <TextField
                id="nickname-focus"
                label="닉네임"
                value="산책요정 주연"
                maxLength={10}
                showCounter
                hint="한글·영문·이모지 1개 가능"
                previewState="focus"
                readOnly
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-paper px-8 py-6">
          <h2 className="text-heading-1 font-bold leading-tight">
            ProgressBar · 6h · 빙고판 상단 진행률
          </h2>
          <div className="mt-4 flex max-w-md flex-col gap-3">
            <div className="flex items-center gap-4">
              <ProgressBar value={0.12} label="3/25 · 12%" className="w-[280px]" />
              <span className="text-caption font-medium leading-normal text-ink-500">
                3/25 · 12%
              </span>
            </div>
            <div className="flex items-center gap-4">
              <ProgressBar value={0.6} label="15/25 · 60%" className="w-[280px]" />
              <span className="text-caption font-medium leading-normal text-ink-500">
                15/25 · 60%
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-lg bg-paper px-8 py-6">
          <h2 className="text-heading-1 font-bold leading-tight">
            BingoCell Targets · text-only guidance
          </h2>
          <p className="mt-2 text-body-2 leading-normal text-ink-500">
            Pencil source of truth: `04. Illustration Master 39종 (BingoCell
            Style)`. Keep line icons in the 30px icon slot; only text-only
            targets need extra capture guidance.
          </p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <PreviewTarget symbol="7" caption="숫자 찾기" hint="간판·주소·버스 번호" />
            <PreviewTarget symbol="5" caption="숫자 찾기" hint="간판·주소·가격표" />
            <PreviewTarget symbol="T" caption="글자 찾기" hint="간판·로고·티셔츠" />
          </div>
        </section>

        <section className="rounded-lg bg-paper px-8 py-6">
          <h2 className="text-heading-1 font-bold leading-tight">
            BingoCell Categories · tinted library
          </h2>
          <p className="mt-2 text-body-2 leading-normal text-ink-500">
            Pencil source now separates category tint from actual target color.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <CategoryCell category="nature" icon="leaf" label="나뭇잎" />
            <CategoryCell category="manmade" icon="signpost" label="표지판" />
            <CategoryCell category="animal" icon="cat" label="고양이" />
            <CategoryCell category="time" icon="clock" label="시계" />
            <CategoryCell category="self" icon="smile" label="웃은 셀카" />
            <ColorCell swatch="red" label="빨간색" />
            <ColorCell swatch="black" label="검은색" />
            <ColorCell swatch="rainbow" label="알록달록" />
          </div>
        </section>
      </div>
    </main>
  )
}

interface PreviewTargetProps {
  symbol: string
  caption: string
  hint: string
}

function PreviewTarget({ symbol, caption, hint }: PreviewTargetProps) {
  return (
    <figure className="flex min-h-28 items-center gap-3 rounded-md border border-ink-100 bg-canvas p-4">
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-cell border border-ink-300 bg-paper">
        <span className="text-[34px] font-bold leading-none text-ink-700">
          {symbol}
        </span>
        <span className="mt-0.5 text-[10px] font-semibold leading-tight text-ink-500">
          {caption}
        </span>
      </div>
      <figcaption className="flex flex-col gap-1 leading-normal">
        <span className="text-caption font-semibold text-ink-700">
          {symbol} 찾기
        </span>
        <span className="text-[11px] font-medium text-ink-500">{hint}</span>
      </figcaption>
    </figure>
  )
}

interface CategoryCellProps {
  category: Exclude<Category, 'color' | 'special'>
  icon: string
  label: string
}

function CategoryCell({ category, icon, label }: CategoryCellProps) {
  const visual = getCategoryVisual(category)
  return (
    <div
      className={`flex h-[66px] w-[66px] flex-col items-center justify-center gap-0.5 rounded-cell border-[1.5px] px-1 py-1 text-center ${visual.cellClassName}`}
    >
      <DynamicIcon
        name={icon}
        size={28}
        strokeWidth={1.8}
        className={visual.iconClassName}
        aria-hidden
      />
      <span className={`line-clamp-2 text-[10px] font-semibold leading-[1.12] ${visual.labelClassName}`}>
        {label}
      </span>
      <span className={`text-[9px] font-semibold leading-tight ${visual.labelClassName}`}>
        색 찾기
      </span>
    </div>
  )
}

interface ColorCellProps {
  swatch: string
  label: string
}

function ColorCell({ swatch, label }: ColorCellProps) {
  const visual = getCategoryVisual('color')
  const swatchVisual = getSwatchVisual(swatch)
  return (
    <div
      className={`flex h-[66px] w-[66px] flex-col items-center justify-center gap-0.5 rounded-cell border-[1.5px] px-1 py-1 text-center ${visual.cellClassName}`}
    >
      <span
        aria-hidden
        className={`h-7 w-7 rounded-pill border-2 shadow-swatch ${swatchVisual.className}`}
        style={swatchVisual.style}
      />
      <span className={`line-clamp-2 text-[10px] font-semibold leading-[1.12] ${visual.labelClassName}`}>
        {label}
      </span>
    </div>
  )
}
