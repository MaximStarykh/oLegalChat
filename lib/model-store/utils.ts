import { FREE_MODELS_IDS } from "@/lib/config"
import { ModelConfig } from "@/lib/models/types"

/**
 * Utility function to filter and sort models based on favorites, search, and visibility
 * @param models - All available models
 * @param favoriteModels - Array of favorite model IDs
 * @param searchQuery - Search query to filter by model name
 * @returns Filtered and sorted models
 */
export function filterAndSortModels(
  models: ModelConfig[],
  favoriteModels: string[],
  searchQuery: string
): ModelConfig[] {
  return models
    .filter((model) => FREE_MODELS_IDS.includes(model.id))
    .filter((model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aIsFavorite = favoriteModels.includes(a.id)
      const bIsFavorite = favoriteModels.includes(b.id)

      if (aIsFavorite && !bIsFavorite) return -1
      if (!aIsFavorite && bIsFavorite) return 1

      // If both are favorites, sort by their order in the favorite list
      if (aIsFavorite && bIsFavorite) {
        return favoriteModels.indexOf(a.id) - favoriteModels.indexOf(b.id)
      }

      // Fallback to original sorting (free models first)
      const aIsFree = FREE_MODELS_IDS.includes(a.id)
      const bIsFree = FREE_MODELS_IDS.includes(b.id)
      return aIsFree === bIsFree ? 0 : aIsFree ? -1 : 1
    })
}
