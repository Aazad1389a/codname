import {
    createGame,
    joinGame,
    startGame,
    selectCard,
    endTurn,
    getGameState
} from "./game.js";

import {
    connectRealtime,
    subscribeToRoom,
    unsubscribeFromRoom
} from "./multiplayer.js";

import {
    initUI,
    showScreen,
    showLobby,
    showGame,
    showLoading,
    showError,
    updateGameUI,
    updatePlayerList
} from "./ui.js";

import {
    getCurrentUser,
    createPlayerProfile,
    getPlayerProfile
} from "./player.js";

import { getSupabase } from "./supabase.js";


// ============================================================
// CODNAME
// Main Application Entry
// ============================================================

const APP = {
    version: "1.0.0",

    user: null,
    profile: null,

    roomId: null,
    roomCode: null,

    gameState: null,

    realtimeChannel: null,

    initialized: false,

    screens: {
        loading: "loading",
        menu: "menu",
        lobby: "lobby",
        game: "game",
        result: "result"
    }
};


// ============================================================
// BOOT
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await boot();
    } catch (error) {
        console.error("CODNAME boot error:", error);

        showError(
            "راه‌اندازی بازی با خطا مواجه شد."
        );
    }
});


// ============================================================
// BOOT PROCESS
// ============================================================

async function boot() {
    console.log(
        `%cCODNAME v${APP.version}`,
        "font-weight:bold;font-size:18px;"
    );

    showLoading("در حال راه‌اندازی بازی...");

    await initializeSupabase();

    await initializeUser();

    initializeUI();

    initializeGlobalEvents();

    await restoreSession();

    APP.initialized = true;

    console.log("CODNAME initialized successfully.");
}


// ============================================================
// SUPABASE
// ============================================================

async function initializeSupabase() {
    const supabase = getSupabase();

    if (!supabase) {
        throw new Error(
            "Supabase client could not be initialized."
        );
    }

    console.log("Supabase initialized.");

    return supabase;
}


// ============================================================
// USER
// ============================================================

async function initializeUser() {
    try {
        APP.user = await getCurrentUser();

        if (!APP.user) {
            console.log("No authenticated user.");

            showScreen(
                APP.screens.menu
            );

            return;
        }

        console.log(
            "Authenticated user:",
            APP.user.id
        );

        APP.profile =
            await getPlayerProfile(APP.user.id);

        if (!APP.profile) {
            APP.profile =
                await createPlayerProfile(APP.user);
        }

    } catch (error) {
        console.error(
            "User initialization failed:",
            error
        );

        APP.user = null;
        APP.profile = null;
    }
}


// ============================================================
// UI
// ============================================================

function initializeUI() {
    initUI({
        user: APP.user,
        profile: APP.profile
    });

    showScreen(
        APP.screens.menu
    );
}


// ============================================================
// GLOBAL EVENTS
// ============================================================

function initializeGlobalEvents() {

    // CREATE ROOM
    document.addEventListener(
        "codname:create-room",
        async (event) => {

            const settings =
                event.detail || {};

            await handleCreateRoom(
                settings
            );
        }
    );


    // JOIN ROOM
    document.addEventListener(
        "codname:join-room",
        async (event) => {

            const code =
                event.detail?.code;

            if (!code) {
                showError(
                    "کد اتاق وارد نشده است."
                );

                return;
            }

            await handleJoinRoom(code);
        }
    );


    // START GAME
    document.addEventListener(
        "codname:start-game",
        async () => {

            await handleStartGame();
        }
    );


    // CARD SELECT
    document.addEventListener(
        "codname:select-card",
        async (event) => {

            const cardId =
                event.detail?.cardId;

            if (!cardId) {
                return;
            }

            await handleCardSelection(
                cardId
            );
        }
    );


    // END TURN
    document.addEventListener(
        "codname:end-turn",
        async () => {

            await handleEndTurn();
        }
    );


    // LEAVE ROOM
    document.addEventListener(
        "codname:leave-room",
        async () => {

            await leaveCurrentRoom();
        }
    );


    // BACK TO MENU
    document.addEventListener(
        "codname:back-menu",
        async () => {

            await leaveCurrentRoom();

            showScreen(
                APP.screens.menu
            );
        }
    );
}


// ============================================================
// CREATE ROOM
// ============================================================

async function handleCreateRoom(settings = {}) {

    if (!APP.user) {
        showError(
            "برای ساخت اتاق ابتدا وارد حساب شوید."
        );

        return;
    }

    try {

        showLoading(
            "در حال ساخت اتاق..."
        );

        const result =
            await createGame({
                userId: APP.user.id,

                mode:
                    settings.mode ||
                    "classic",

                maxPlayers:
                    settings.maxPlayers ||
                    8,

                boardSize:
                    settings.boardSize ||
                    25
            });


        if (!result) {
            throw new Error(
                "Room creation returned no result."
            );
        }


        APP.roomId =
            result.roomId;

        APP.roomCode =
            result.roomCode;


        await enterLobby();


    } catch (error) {

        console.error(
            "Create room failed:",
            error
        );

        showError(
            "ساخت اتاق انجام نشد."
        );
    }
}


// ============================================================
// JOIN ROOM
// ============================================================

async function handleJoinRoom(code) {

    if (!APP.user) {

        showError(
            "برای ورود به اتاق ابتدا وارد حساب شوید."
        );

        return;
    }


    try {

        showLoading(
            "در حال ورود به اتاق..."
        );


        const result =
            await joinGame({
                code:
                    code
                        .trim()
                        .toUpperCase(),

                userId:
                    APP.user.id
            });


        if (!result) {
            throw new Error(
                "Join room returned no result."
            );
        }


        APP.roomId =
            result.roomId;

        APP.roomCode =
            result.roomCode;


        await enterLobby();


    } catch (error) {

        console.error(
            "Join room failed:",
            error
        );

        showError(
            "ورود به اتاق انجام نشد. کد اتاق را بررسی کنید."
        );
    }
}


// ============================================================
// ENTER LOBBY
// ============================================================

async function enterLobby() {

    if (!APP.roomId) {
        throw new Error(
            "Missing room ID."
        );
    }


    showLobby({

        roomId:
            APP.roomId,

        roomCode:
            APP.roomCode,

        user:
            APP.user,

        profile:
            APP.profile
    });


    showScreen(
        APP.screens.lobby
    );


    await setupRealtime();


    await refreshGameState();
}


// ============================================================
// REALTIME
// ============================================================

async function setupRealtime() {

    if (
        APP.realtimeChannel
    ) {

        await unsubscribeFromRoom(
            APP.realtimeChannel
        );

        APP.realtimeChannel = null;
    }


    const connection =
        await connectRealtime();


    APP.realtimeChannel =
        await subscribeToRoom(
            connection,
            APP.roomId,
            async (payload) => {

                console.log(
                    "Realtime event:",
                    payload
                );

                await handleRealtimeUpdate(
                    payload
                );
            }
        );
}


// ============================================================
// REALTIME UPDATE
// ============================================================

async function handleRealtimeUpdate(
    payload
) {

    try {

        await refreshGameState();

    } catch (error) {

        console.error(
            "Realtime update failed:",
            error
        );
    }
}


// ============================================================
// REFRESH GAME STATE
// ============================================================

async function refreshGameState() {

    if (!APP.roomId) {
        return;
    }


    const state =
        await getGameState(
            APP.roomId
        );


    if (!state) {
        return;
    }


    APP.gameState =
        state;


    processGameState(
        state
    );
}


// ============================================================
// GAME STATE PROCESSOR
// ============================================================

function processGameState(state) {

    updatePlayerList(
        state.players || []
    );


    // WAITING
    if (
        state.status ===
        "waiting"
    ) {

        showLobby({

            roomId:
                APP.roomId,

            roomCode:
                APP.roomCode,

            user:
                APP.user,

            profile:
                APP.profile,

            players:
                state.players || [],

            settings:
                state.settings || {}
        });


        showScreen(
            APP.screens.lobby
        );

        return;
    }


    // PLAYING
    if (
        state.status ===
        "playing"
    ) {

        showGame({

            roomId:
                APP.roomId,

            roomCode:
                APP.roomCode,

            user:
                APP.user,

            profile:
                APP.profile,

            game:
                state
        });


        updateGameUI(
            state
        );


        showScreen(
            APP.screens.game
        );

        return;
    }


    // FINISHED
    if (
        state.status ===
        "finished"
    ) {

        showGame({

            roomId:
                APP.roomId,

            roomCode:
                APP.roomCode,

            user:
                APP.user,

            profile:
                APP.profile,

            game:
                state
        });


        updateGameUI(
            state
        );


        handleGameFinished(
            state
        );

        return;
    }
}


// ============================================================
// START GAME
// ============================================================

async function handleStartGame() {

    if (!APP.roomId) {
        return;
    }


    if (!APP.user) {
        return;
    }


    try {

        showLoading(
            "در حال شروع بازی..."
        );


        const result =
            await startGame({

                roomId:
                    APP.roomId,

                userId:
                    APP.user.id
            });


        if (!result) {
            throw new Error(
                "Start game returned no result."
            );
        }


        await refreshGameState();


    } catch (error) {

        console.error(
            "Start game failed:",
            error
        );

        showError(
            "شروع بازی انجام نشد."
        );
    }
}


// ============================================================
// CARD SELECTION
// ============================================================

async function handleCardSelection(
    cardId
) {

    if (!APP.roomId) {
        return;
    }


    if (!APP.user) {
        return;
    }


    if (
        !APP.gameState ||
        APP.gameState.status !==
        "playing"
    ) {
        return;
    }


    try {

        const result =
            await selectCard({

                roomId:
                    APP.roomId,

                userId:
                    APP.user.id,

                cardId:
                    cardId
            });


        if (!result) {
            return;
        }


        await refreshGameState();


        if (
            result.turnEnded
        ) {

            console.log(
                "Turn automatically ended."
            );
        }


        if (
            result.gameFinished
        ) {

            await handleGameFinished(
                result.gameState
            );
        }


    } catch (error) {

        console.error(
            "Card selection failed:",
            error
        );

        showError(
            "انتخاب کارت انجام نشد."
        );
    }
}


// ============================================================
// END TURN
// ============================================================

async function handleEndTurn() {

    if (!APP.roomId) {
        return;
    }


    if (!APP.user) {
        return;
    }


    try {

        await endTurn({

            roomId:
                APP.roomId,

            userId:
                APP.user.id
        });


        await refreshGameState();


    } catch (error) {

        console.error(
            "End turn failed:",
            error
        );

        showError(
            "پایان نوبت انجام نشد."
        );
    }
}


// ============================================================
// GAME FINISHED
// ============================================================

async function handleGameFinished(
    state
) {

    if (!state) {
        return;
    }


    updateGameUI(
        state
    );


    showScreen(
        APP.screens.result
    );


    document.dispatchEvent(
        new CustomEvent(
            "codname:game-finished",
            {
                detail: state
            }
        )
    );
}


// ============================================================
// LEAVE ROOM
// ============================================================

async function leaveCurrentRoom() {

    try {

        if (
            APP.realtimeChannel
        ) {

            await unsubscribeFromRoom(
                APP.realtimeChannel
            );

            APP.realtimeChannel = null;
        }

    } catch (error) {

        console.warn(
            "Realtime cleanup warning:",
            error
        );
    }


    APP.roomId = null;
    APP.roomCode = null;
    APP.gameState = null;
}


// ============================================================
// AUTH STATE
// ============================================================

async function restoreSession() {

    try {

        const supabase =
            getSupabase();


        const {
            data
        } =
            await supabase.auth.getSession();


        if (
            data?.session?.user
        ) {

            APP.user =
                data.session.user;


            APP.profile =
                await getPlayerProfile(
                    APP.user.id
                );


            if (!APP.profile) {

                APP.profile =
                    await createPlayerProfile(
                        APP.user
                    );
            }
        }

    } catch (error) {

        console.error(
            "Session restore failed:",
            error
        );
    }
}


// ============================================================
// AUTH LISTENER
// ============================================================

const supabase =
    getSupabase();


if (supabase) {

    supabase.auth.onAuthStateChange(
        async (
            event,
            session
        ) => {

            console.log(
                "Auth event:",
                event
            );


            if (session?.user) {

                APP.user =
                    session.user;


                APP.profile =
                    await getPlayerProfile(
                        APP.user.id
                    );


                if (!APP.profile) {

                    APP.profile =
                        await createPlayerProfile(
                            APP.user
                        );
                }
            } else {

                APP.user = null;
                APP.profile = null;

                await leaveCurrentRoom();

                showScreen(
                    APP.screens.menu
                );
            }
        }
    );
}


// ============================================================
// PUBLIC APP API
// ============================================================

window.CODNAME = {

    version:
        APP.version,

    getUser() {
        return APP.user;
    },

    getProfile() {
        return APP.profile;
    },

    getRoom() {
        return {
            id:
                APP.roomId,

            code:
                APP.roomCode
        };
    },

    getGameState() {
        return APP.gameState;
    },

    async refresh() {
        return refreshGameState();
    },

    async leaveRoom() {
        return leaveCurrentRoom();
    }
};


// ============================================================
// DEBUG
// ============================================================

window.addEventListener(
    "error",
    (event) => {

        console.error(
            "Global error:",
            event.error
        );
    }
);


window.addEventListener(
    "unhandledrejection",
    (event) => {

        console.error(
            "Unhandled promise rejection:",
            event.reason
        );
    }
);


console.log(
    "CODNAME main.js loaded."
);
