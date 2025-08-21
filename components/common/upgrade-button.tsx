"use client"

import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import Link from "next/link"

type UpgradeButtonProps = {
  className?: string
}

export function UpgradeButton({ className }: UpgradeButtonProps) {
  return (
    <Button
      asChild
      aria-label="Upgrade your plan"
      className={`h-11 rounded-full bg-[#F3F1FF] px-5 text-[20px] font-semibold text-[#4F46E5] shadow-sm transition-colors hover:bg-[#E9E6FF] active:bg-[#DED9FF] focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 dark:bg-[rgba(79,70,229,0.12)] dark:text-indigo-300 dark:hover:bg-[rgba(79,70,229,0.18)] dark:active:bg-[rgba(79,70,229,0.24)] dark:focus-visible:ring-indigo-400/40 ${className || ""}`}
    >
      <Link href="/upgrade" className="flex items-center gap-3">
        <Sparkles className="h-5 w-5" />
        <span>Upgrade your plan</span>
      </Link>
    </Button>
  )
}


