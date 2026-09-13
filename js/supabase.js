import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const SUPABASE_URL = "https://neqxfgjmoatdsglpixtc.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Og67hr_Cp3hAtpQseYFArA_mkmoaPnX";

let client = null;

export function getSupabase() {
    if (!client) {
        client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
            realtime: { params: { eventsPerSecond: 10 } }
        });
    }
    return client;
}

export async function getCurrentUser() {
    const { data, error } = await getSupabase().auth.getUser();
    if (error) return null;
    return data.user ?? null;
}

export async function databaseSelect(table, query = {}) {
    let request = getSupabase().from(table).select(query.select ?? "*");
    if (query.eq) for (const [key, value] of Object.entries(query.eq)) request = request.eq(key, value);
    if (query.in) for (const [key, value] of Object.entries(query.in)) request = request.in(key, value);
    if (query.order) request = request.order(query.order.column, { ascending: query.order.ascending ?? true });
    if (query.limit) request = request.limit(query.limit);
    const { data, error } = await request;
    if (error) throw error;
    return data ?? [];
}

export async function databaseInsert(table, rows) {
    const { data, error } = await getSupabase().from(table).insert(rows).select();
    if (error) throw error;
    return data ?? [];
}

export async function databaseUpdate(table, values, eq) {
    let request = getSupabase().from(table).update(values);
    for (const [key, value] of Object.entries(eq)) request = request.eq(key, value);
    const { data, error } = await request.select();
    if (error) throw error;
    return data ?? [];
}

export async function databaseDelete(table, eq) {
    let request = getSupabase().from(table).delete();
    for (const [key, value] of Object.entries(eq)) request = request.eq(key, value);
    const { data, error } = await request.select();
    if (error) throw error;
    return data ?? [];
}

export function isSupabaseConfigured() {
    return true;
}
