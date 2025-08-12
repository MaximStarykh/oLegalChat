import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

interface UserPreferences {
  layout: string
  prompt_suggestions: boolean
  show_tool_invocations: boolean
  show_conversation_previews: boolean
  multi_model_enabled: boolean
  hidden_models: string[]
}

type UserPreferencesUpdate = Partial<UserPreferences>

const prefsSchema = z.object({
  layout: z.string().optional(),
  prompt_suggestions: z.boolean().optional(),
  show_tool_invocations: z.boolean().optional(),
  show_conversation_previews: z.boolean().optional(),
  multi_model_enabled: z.boolean().optional(),
  hidden_models: z.array(z.string()).optional(),
})

export async function GET() {
  try {
    const supabase = await createClient()

    if (!supabase) {
      // Supabase disabled: return default preferences for unauthenticated mode
      return NextResponse.json({
        layout: "fullscreen",
        prompt_suggestions: true,
        show_tool_invocations: true,
        show_conversation_previews: true,
        multi_model_enabled: false,
        hidden_models: [],
      })
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's preferences
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error) {
      // If no preferences exist, return defaults
      if (error.code === "PGRST116") {
        return NextResponse.json({
          layout: "fullscreen",
          prompt_suggestions: true,
          show_tool_invocations: true,
          show_conversation_previews: true,
          multi_model_enabled: false,
          hidden_models: [],
        })
      }

      console.error("Error fetching user preferences:", error)
      return NextResponse.json(
        { error: "Failed to fetch user preferences" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      layout: data.layout,
      prompt_suggestions: data.prompt_suggestions,
      show_tool_invocations: data.show_tool_invocations,
      show_conversation_previews: data.show_conversation_previews,
      multi_model_enabled: data.multi_model_enabled,
      hidden_models: data.hidden_models || [],
    })
  } catch (error) {
    console.error("Error in user-preferences GET API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      // Supabase disabled: emulate update by merging onto defaults and echoing back
      const parseResult = prefsSchema.safeParse(await request.json())
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Invalid preferences" },
          { status: 400 }
        )
      }
      const {
        layout,
        prompt_suggestions,
        show_tool_invocations,
        show_conversation_previews,
        multi_model_enabled,
        hidden_models,
      } = parseResult.data

      const merged: UserPreferences = {
        layout: layout ?? "fullscreen",
        prompt_suggestions: prompt_suggestions ?? true,
        show_tool_invocations: show_tool_invocations ?? true,
        show_conversation_previews: show_conversation_previews ?? true,
        multi_model_enabled: multi_model_enabled ?? false,
        hidden_models: hidden_models ?? [],
      }

      return NextResponse.json({ success: true, ...merged })
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate the request body
    const parseResult = prefsSchema.safeParse(await request.json())
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid preferences" },
        { status: 400 }
      )
    }
    const {
      layout,
      prompt_suggestions,
      show_tool_invocations,
      show_conversation_previews,
      multi_model_enabled,
      hidden_models,
    } = parseResult.data

    // Prepare update object with only provided fields
    const updateData: UserPreferencesUpdate = {}
    if (layout !== undefined) updateData.layout = layout
    if (prompt_suggestions !== undefined)
      updateData.prompt_suggestions = prompt_suggestions
    if (show_tool_invocations !== undefined)
      updateData.show_tool_invocations = show_tool_invocations
    if (show_conversation_previews !== undefined)
      updateData.show_conversation_previews = show_conversation_previews
    if (multi_model_enabled !== undefined)
      updateData.multi_model_enabled = multi_model_enabled
    if (hidden_models !== undefined) updateData.hidden_models = hidden_models

    // Try to update first, then insert if doesn't exist
    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: user.id,
          ...updateData,
        },
        {
          onConflict: "user_id",
        }
      )
      .select("*")
      .single()

    if (error) {
      console.error("Error updating user preferences:", error)
      return NextResponse.json(
        { error: "Failed to update user preferences" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      layout: data.layout,
      prompt_suggestions: data.prompt_suggestions,
      show_tool_invocations: data.show_tool_invocations,
      show_conversation_previews: data.show_conversation_previews,
      multi_model_enabled: data.multi_model_enabled,
      hidden_models: data.hidden_models || [],
    })
  } catch (error) {
    console.error("Error in user-preferences PUT API:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
