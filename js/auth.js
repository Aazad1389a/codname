import { getSupabase } from "./supabase.js";

function assertSupabase() {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase authentication is not configured.");
    return supabase;
}

export async function signUp({ email, password, username }) {
    const supabase = assertSupabase();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanUsername = String(username || "").trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
        throw new Error("ایمیل معتبر وارد کنید.");
    }
    if (password.length < 6) {
        throw new Error("رمز عبور باید حداقل ۶ کاراکتر باشد.");
    }
    if (!/^[a-zA-Z0-9_-]{3,24}$/.test(cleanUsername)) {
        throw new Error("نام کاربری باید ۳ تا ۲۴ کاراکتر و فقط شامل حروف انگلیسی، عدد، _ یا - باشد.");
    }

    const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
            data: { username: cleanUsername }
        }
    });

    if (error) throw error;
    return data;
}

export async function signIn({ email, password }) {
    const supabase = assertSupabase();
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
        throw new Error("ایمیل معتبر وارد کنید.");
    }
    if (!password) throw new Error("رمز عبور را وارد کنید.");

    const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
    });

    if (error) throw error;
    return data;
}

export async function signOut() {
    const supabase = assertSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}
