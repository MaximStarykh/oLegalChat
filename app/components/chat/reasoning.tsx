import { Markdown } from "@/components/prompt-kit/markdown"
import React from "react"
import { cn } from "@/lib/utils"
import { BrainIcon, CaretDownIcon } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"

type ReasoningProps = {
  reasoning: string
  isStreaming?: boolean
}

const TRANSITION = {
  type: "spring",
  duration: 0.2,
  bounce: 0,
}

export function Reasoning({ reasoning, isStreaming }: ReasoningProps) {
  const [wasStreaming, setWasStreaming] = useState(isStreaming ?? false)
  const [isExpanded, setIsExpanded] = useState(() => true)

  // Avoid state updates during render; react to prop changes in an effect
  if (process.env.NODE_ENV !== "production") {
    try {
      if (typeof window !== "undefined") {
        console.log(
          "[Reasoning] mount: isStreaming=",
          isStreaming,
          " initialExpanded=",
          isExpanded
        )
      }
    } catch {}
  }

  // Collapse panel when streaming finishes (show fully while streaming)
  React.useEffect(() => {
    if (isStreaming) {
      setWasStreaming(true)
      setIsExpanded(true)
    } else if (wasStreaming && isStreaming === false) {
      setWasStreaming(false)
      setIsExpanded(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming])

  return (
    <div>
      <button
        className="text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <BrainIcon className="size-3" />
        <span>Think</span>
        <CaretDownIcon
          className={cn(
            "size-3 transition-transform",
            isExpanded ? "rotate-180" : ""
          )}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="mt-2 overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={TRANSITION}
          >
            <div className="text-muted-foreground border-muted-foreground/20 flex flex-col border-l pl-4 text-sm">
              <Markdown>{reasoning}</Markdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
