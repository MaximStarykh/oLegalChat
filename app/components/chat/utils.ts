export const addUTM = (url: string) => {
  try {
    // Check if the URL is valid
    const u = new URL(url)
    // Ensure it's using HTTP or HTTPS protocol
    if (!["http:", "https:"].includes(u.protocol)) {
      return url // Return original URL for non-http(s) URLs
    }

    u.searchParams.set("utm_source", "oLegal.chat")
    u.searchParams.set("utm_medium", "research")
    return u.toString()
  } catch {
    // If URL is invalid, return the original URL without modification
    return url
  }
}

export const getFavicon = (url: string | null) => {
  if (!url) return null

  try {
    // Check if the URL is valid
    const urlObj = new URL(url)
    // Ensure it's using HTTP or HTTPS protocol
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return null
    }

    const domain = urlObj.hostname
    
    // Validate domain format
    if (!domain || domain.length === 0 || domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
      return null
    }
    
    // Try DuckDuckGo which is more reliable for government sites
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`
  } catch {
    // No need to log errors for invalid URLs
    return null
  }
}

// Alternative favicon URLs for fallback
export const getFaviconFallback = (url: string | null) => {
  if (!url) return null

  try {
    const urlObj = new URL(url)
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return null
    }

    const domain = urlObj.hostname
    
    // Validate domain format
    if (!domain || domain.length === 0 || domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
      return null
    }
    
    // Return array of fallback options
    return [
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      `https://favicon.io/favicon/${domain}/32x32.png`
    ]
  } catch {
    return null
  }
}

export const formatUrl = (url: string) => {
  try {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")
  } catch {
    return url
  }
}

export const getSiteName = (url: string) => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, "")
  } catch {
    return url
  }
}
