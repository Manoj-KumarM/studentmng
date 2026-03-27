import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "send_code") {
      const { email } = body;
      if (!email) {
        return new Response(JSON.stringify({ error: "Email required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user exists
      const { data: user } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (!user) {
        return new Response(JSON.stringify({ error: "Email not found" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

      // Mark previous codes as used
      await supabase
        .from("password_reset_codes")
        .update({ used: true })
        .eq("user_id", user.id)
        .eq("used", false);

      // Insert new code
      await supabase.from("password_reset_codes").insert({
        user_id: user.id,
        email: user.email,
        reset_code: code,
        expires_at: expiresAt,
      });

      // For prototype, we'll log the code (in production, send email)
      console.log(`Password reset code for ${email}: ${code}`);

      return new Response(
        JSON.stringify({ message: "Reset code sent", code }),  // returning code for prototype testing
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify_and_reset") {
      const { email, code, new_password } = body;

      if (!email || !code || !new_password) {
        return new Response(JSON.stringify({ error: "All fields required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find valid code
      const { data: resetCode } = await supabase
        .from("password_reset_codes")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .eq("reset_code", code)
        .eq("used", false)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!resetCode) {
        return new Response(JSON.stringify({ error: "Invalid or expired code" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update password
      await supabase
        .from("users")
        .update({ password_hash: new_password + "_hashed" })
        .eq("id", resetCode.user_id);

      // Mark code as used
      await supabase
        .from("password_reset_codes")
        .update({ used: true })
        .eq("id", resetCode.id);

      return new Response(
        JSON.stringify({ message: "Password reset successful" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "change_password") {
      const { user_id, current_password, new_password } = body;

      if (!user_id || !current_password || !new_password) {
        return new Response(JSON.stringify({ error: "All fields required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify current password
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", user_id)
        .single();

      if (!user || user.password_hash !== current_password + "_hashed") {
        return new Response(JSON.stringify({ error: "Current password is incorrect" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update password
      await supabase
        .from("users")
        .update({ password_hash: new_password + "_hashed" })
        .eq("id", user_id);

      return new Response(
        JSON.stringify({ message: "Password changed successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
