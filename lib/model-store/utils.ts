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
    .filter((model) => {
      // If user has favorite models, only show favorites
      if (favoriteModels && favoriteModels.length > 0) {
        return favoriteModels.includes(model.id)
      }
      // If no favorites, show all models
      return true
    })
    .filter((model) =>
      model.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      // If user has favorite models, maintain their order
      if (favoriteModels && favoriteModels.length > 0) {
        const aIndex = favoriteModels.indexOf(a.id)
        const bIndex = favoriteModels.indexOf(b.id)
        return aIndex - bIndex
      }

      // Fallback to original sorting (free models first)
      const aIsFree = FREE_MODELS_IDS.includes(a.id)
      const bIsFree = FREE_MODELS_IDS.includes(b.id)
      return aIsFree === bIsFree ? 0 : aIsFree ? -1 : 1
    })
}
