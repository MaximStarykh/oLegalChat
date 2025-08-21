"use client"

import { cn } from "@/lib/utils"
import type { SourceUIPart } from "@ai-sdk/ui-utils"
import { CaretDown, IconProps, Link } from "@phosphor-icons/react"
import { AnimatePresence, motion } from "motion/react"
import Image from "next/image"
import React, { useState, useCallback } from "react"
import { addUTM, formatUrl, getFavicon, getFaviconFallback } from "./utils"

type SourcesListProps = {
  sources: SourceUIPart["source"][]
  className?: string
}

const TRANSITION = {
  type: "spring",
  duration: 0.2,
  bounce: 0,
}

const CaretDownIcon = (props: IconProps) => <CaretDown {...props} />
const LinkIcon = (props: IconProps) => <Link {...props} />

export function SourcesList({ sources, className }: SourcesListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [failedFavicons, setFailedFavicons] = useState<Set<string>>(new Set())
  const [faviconFallbacks, setFaviconFallbacks] = useState<Map<string, string[]>>(new Map())
  const [currentFallbackIndex, setCurrentFallbackIndex] = useState<Map<string, number>>(new Map())

  const handleFaviconError = useCallback((url: string) => {
    setFailedFavicons((prev: Set<string>) => new Set(prev).add(url))
    
    // Get fallback favicon URLs if we haven't already
    if (!faviconFallbacks.has(url)) {
      const fallbacks = getFaviconFallback(url)
      if (fallbacks) {
        setFaviconFallbacks((prev: Map<string, string[]>) => new Map(prev).set(url, fallbacks))
        setCurrentFallbackIndex((prev: Map<string, number>) => new Map(prev).set(url, 0))
      }
    }
  }, [faviconFallbacks])

  const getFaviconUrl = useCallback((url: string) => {
    // If this URL has failed, try the next fallback
    if (failedFavicons.has(url)) {
      const fallbacks = faviconFallbacks.get(url)
      const currentIndex = currentFallbackIndex.get(url) || 0
      
      if (fallbacks && currentIndex < fallbacks.length) {
        return fallbacks[currentIndex]
      }
      
      // If we've tried all fallbacks, return null to show fallback icon
      return null
    }
    
    return getFavicon(url)
  }, [failedFavicons, faviconFallbacks, currentFallbackIndex])

  const handleFallbackError = useCallback((url: string) => {
    const currentIndex = currentFallbackIndex.get(url) || 0
    const fallbacks = faviconFallbacks.get(url)
    
    if (fallbacks && currentIndex < fallbacks.length - 1) {
      // Try the next fallback
      setCurrentFallbackIndex((prev: Map<string, number>) => new Map(prev).set(url, currentIndex + 1))
    } else {
      // All fallbacks failed, mark as completely failed
      setFailedFavicons((prev: Set<string>) => new Set(prev).add(url))
    }
  }, [currentFallbackIndex, faviconFallbacks])

  const renderFavicon = useCallback((source: SourceUIPart["source"], index: number) => {
    const faviconUrl = getFaviconUrl(source.url)
    const hasFailedCompletely = failedFavicons.has(source.url) && 
      (!faviconFallbacks.get(source.url) || 
       (currentFallbackIndex.get(source.url) || 0) >= (faviconFallbacks.get(source.url)?.length || 0))

    if (!faviconUrl || hasFailedCompletely) {
      return (
        <div
          key={`${source.url}-${index}`}
          className="bg-muted border-background h-4 w-4 rounded-full border"
        />
      )
    }

    return (
      <Image
        key={`${source.url}-${index}`}
        src={faviconUrl}
        alt={`Favicon for ${source.title}`}
        width={16}
        height={16}
        className="border-background h-4 w-4 rounded-sm border"
        onError={() => handleFallbackError(source.url)}
        onLoad={() => {
          // Clear any error state if image loads successfully
          setFailedFavicons((prev: Set<string>) => {
            const newSet = new Set(prev)
            newSet.delete(source.url)
            return newSet
          })
        }}
      />
    )
  }, [getFaviconUrl, failedFavicons, faviconFallbacks, currentFallbackIndex, handleFallbackError])

  return (
    <div className={cn("my-4", className)}>
      <div className="border-border flex flex-col gap-0 overflow-hidden rounded-md border">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
          className="hover:bg-accent flex w-full flex-row items-center rounded-t-md px-3 py-2 transition-colors"
        >
          <div className="flex flex-1 flex-row items-center gap-2 text-left text-sm">
            Sources
            <div className="flex -space-x-1">
              {sources?.map((source, index) => renderFavicon(source, index))}
              {sources.length > 3 && (
                <span className="text-muted-foreground ml-1 text-xs">
                  +{sources.length - 3}
                </span>
              )}
            </div>
          </div>
          <CaretDownIcon
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded ? "rotate-180 transform" : ""
            )}
          />
        </button>

        <(AnimatePresence as any) initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={TRANSITION as any}
              className="overflow-hidden"
            >
              <ul className="space-y-2 px-3 pt-3 pb-3">
                {sources.map((source) => {
                  const faviconUrl = getFaviconUrl(source.url)
                  const hasFailedCompletely = failedFavicons.has(source.url) && 
                    (!faviconFallbacks.get(source.url) || 
                     (currentFallbackIndex.get(source.url) || 0) >= (faviconFallbacks.get(source.url)?.length || 0))

                  return (
                    <li key={source.id || source.url || Math.random()} className="flex items-center text-sm">
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <a
                          href={addUTM(source.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary group line-clamp-1 flex items-center gap-1 hover:underline"
                        >
                          {!faviconUrl || hasFailedCompletely ? (
                            <div className="bg-muted h-4 w-4 flex-shrink-0 rounded-full" />
                          ) : (
                            <Image
                              src={faviconUrl}
                              alt={`Favicon for ${source.title}`}
                              width={16}
                              height={16}
                              className="h-4 w-4 flex-shrink-0 rounded-sm"
                              onError={() => handleFallbackError(source.url)}
                              onLoad={() => {
                                // Clear any error state if image loads successfully
                                setFailedFavicons((prev: Set<string>) => {
                                  const newSet = new Set(prev)
                                  newSet.delete(source.url)
                                  return newSet
                                })
                              }}
                            />
                          )}
                          <span className="truncate">{source.title}</span>
                          <LinkIcon className="inline h-3 w-3 flex-shrink-0 opacity-70 transition-opacity group-hover:opacity-100" />
                        </a>
                        <div className="text-muted-foreground line-clamp-1 text-xs">
                          {formatUrl(source.url)}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </motion.div>
          )}
        </(AnimatePresence as any)>
      </div>
    </div>
  )
}
