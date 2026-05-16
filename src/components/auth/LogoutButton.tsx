'use client'

import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'

interface LogoutButtonProps {
  children?: ReactNode
  className?: string
}

export function LogoutButton({
  children = '로그아웃',
  className,
}: LogoutButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleLogout() {
    if (pending) return

    setPending(true)
    try {
      const response = await fetch('/logout?next=/', {
        method: 'POST',
      })
      if (!response.ok && !response.redirected) {
        throw new Error(`Logout failed with ${response.status}`)
      }
      router.replace('/')
      router.refresh()
    } catch (error) {
      console.warn('Unable to log out', error)
      window.alert('로그아웃을 완료하지 못했어요. 다시 시도해주세요.')
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={handleLogout}
      className={cn('disabled:pointer-events-none disabled:opacity-60', className)}
    >
      {pending ? '로그아웃 중' : children}
    </button>
  )
}
