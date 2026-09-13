import { getSupabase } from "./supabase.js";

export async function connectRealtime() {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase is not configured.");
    return supabase;
}

export async function subscribeToRoom(supabase, roomId, callback) {
    if (!supabase || !roomId) throw new Error("Realtime room subscription requires a room id.");

    const channel = supabase
        .channel(`codname-room-${roomId}`, {
            config: { broadcast: { self: false }, presence: { key: roomId } }
        })
        .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "rooms",
            filter: `id=eq.${roomId}`
        }, callback)
        .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "room_players",
            filter: `room_id=eq.${roomId}`
        }, callback)
        .subscribe((status) => console.log("Realtime status:", status));

    return channel;
}

export async function unsubscribeFromRoom(channel) {
    if (!channel) return;
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.removeChannel(channel);
}

export function roomPresence(channel, userId, metadata = {}) {
    if (!channel || !userId) return Promise.resolve();
    return channel.track({ userId, ...metadata, onlineAt: new Date().toISOString() });
}
