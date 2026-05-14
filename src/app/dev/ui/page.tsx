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
import { Illust, type IllustKey } from '@/components/illust'

const NATURE_ILLUST_PREVIEW: ReadonlyArray<{
  label: string
  name: IllustKey
  pencilNode: string
}> = [
  { label: '꽃', name: 'flower', pencilNode: 'TEUMp' },
  { label: '나뭇잎', name: 'natureLeaf', pencilNode: '43jQ0' },
  { label: '민들레', name: 'dandelion', pencilNode: 'R4nEb' },
  { label: '화분', name: 'pottedPlant', pencilNode: 'ZfTPv' },
  { label: '나무', name: 'tree', pencilNode: '6wNxN' },
  { label: '구름', name: 'cloud', pencilNode: 'mL1Xy' },
  { label: '햇빛', name: 'sunlight', pencilNode: 'yWRog' },
  { label: '무지개', name: 'rainbow', pencilNode: 'rR3JN' },
]

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
            Illustration Gate · Nature 8
          </h2>
          <p className="mt-2 text-body-2 leading-normal text-ink-500">
            Slice 7 stable nature set from `new.pen`: 8 sticker-flat SVGs.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            {NATURE_ILLUST_PREVIEW.map((item) => (
              <PreviewIllust key={item.name} {...item} />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

interface PreviewIllustProps {
  label: string
  name: IllustKey
  pencilNode: string
}

function PreviewIllust({ label, name, pencilNode }: PreviewIllustProps) {
  return (
    <figure className="flex w-32 flex-col items-center gap-2 rounded-md border border-ink-100 bg-canvas p-3">
      <Illust name={name} title={label} size={96} />
      <figcaption className="flex flex-col items-center text-center leading-normal">
        <span className="text-caption font-semibold text-ink-700">{label}</span>
        <span className="text-[10px] font-medium text-ink-500">
          {pencilNode}
        </span>
      </figcaption>
    </figure>
  )
}
