import { getSupabase, databaseSelect, databaseInsert, databaseUpdate } from "./supabase.js";

export async function getCurrentUser() {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user ?? null;
}

function fallbackName(user) {
    const raw = user?.user_metadata?.username || user?.email?.split("@")[0] || "Player";
    return raw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 20) || "Player";
}

export async function createPlayerProfile(user) {
    if (!user?.id) throw new Error("Missing user id.");
    const row = {
        id: user.id,
        username: fallbackName(user),
        avatar_url: user.user_metadata?.avatar_url || null
    };
    try {
        const rows = await databaseInsert("profiles", row);
        return rows[0] ?? row;
    } catch (error) {
        // A concurrent session may have created it already.
        const existing = await getPlayerProfile(user.id);
        if (existing) return existing;
        throw error;
    }
}

export async function getPlayerProfile(userId) {
    if (!userId) return null;
    const rows = await databaseSelect("profiles", {
        eq: { id: userId },
        limit: 1
    });
    return rows[0] ?? null;
}

export async function updatePlayerProfile(userId, values) {
    const allowed = {};
    if (typeof values.username === "string") allowed.username = values.username.trim().slice(0, 24);
    if (typeof values.avatar_url === "string" || values.avatar_url === null) allowed.avatar_url = values.avatar_url;
    if (typeof values.xp === "number") allowed.xp = Math.max(0, Math.floor(values.xp));
    if (typeof values.level === "number") allowed.level = Math.max(1, Math.floor(values.level));
    const rows = await databaseUpdate("profiles", allowed, { id: userId });
    return rows[0] ?? null;
}
