import { MODEL_DEFAULT } from "@/lib/config"
import { isSupabaseEnabled } from "@/lib/supabase/config"
import { createClient } from "@/lib/supabase/server"
import { createGuestServerClient } from "@/lib/supabase/server-guest"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (!isSupabaseEnabled) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Supabase is not enabled in this deployment.")}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Missing authentication code")}`
    )
  }

  const supabase = await createClient()
  const supabaseAdmin = await createGuestServerClient()

  if (!supabase || !supabaseAdmin) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Supabase is not enabled in this deployment.")}`
    )
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("Auth error:", error)
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(error.message)}`
    )
  }

  const user = data?.user
  if (!user || !user.id || !user.email) {
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent("Missing user info")}`
    )
  }

  try {
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("favorite_models")
      .eq("id", user.id)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching user:", fetchError)
    }

    if (!existingUser) {
      const { error: insertError } = await supabaseAdmin
        .from("users")
        .insert({
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
          message_count: 0,
          premium: false,
          favorite_models: [MODEL_DEFAULT],
        })

      if (insertError) {
        console.error("Error inserting user:", insertError)
      }
    } else if (
      !existingUser.favorite_models ||
      existingUser.favorite_models.length === 0
    ) {
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ favorite_models: [MODEL_DEFAULT] })
        .eq("id", user.id)

      if (updateError) {
        console.error("Error setting default model:", updateError)
      }
    }
  } catch (err) {
    console.error("Unexpected user upsert error:", err)
  }

  const host = request.headers.get("host")
  const protocol = host?.includes("localhost") ? "http" : "https"

  const redirectUrl = `${protocol}://${host}${next}`

  return NextResponse.redirect(redirectUrl)
}
