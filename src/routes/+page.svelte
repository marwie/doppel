<script lang="ts">
    import { browser } from "$app/environment";
    import { pushState } from "$app/navigation";
    import { onMount } from "svelte";
    import type { DataConnection } from "peerjs";
    import type Peer from "peerjs";
    import Card from "../components/card.svelte";
    import { getCuteName } from "$lib/cute names";
    import { base } from "$app/paths";

    $: room = "";
    $: peerId = "";
    $: messages = new Array<MessageObject>();
    $: connectedIds = new Array<string>();
    const connections: DataConnection[] = [];

    let message = "";

    let peer: Peer;

    type MessageObject = {
        id: string;
        message: string;
        color: string;
    };

    onMount(async () => {
        if (!browser) return;
        // timeout just because dev environment should give peer a moment to dispose the old connection
        setTimeout(
            () => {
                room = new URLSearchParams(location.search).get("room");
                if (!room) {
                    room = getCuteName();
                    __setRoom(room);
                }
                handleConnection(room, null);
            },
            500 + Math.random() * 500,
        );
    });

    // Well since we just want to make a double and always have only two users (for now)
    // we can ignore connecting all peers to each other
    function isHosting() {
        return peerId === new URLSearchParams(location.search).get("room");
    }

    async function handleConnection(room: string, other: null | string) {
        const Peer = (await import("peerjs")).default;
        peer = new Peer(room);
        peer.on("open", (id) => {
            console.log("Connected to peer server", id);
            peerId = id;
            if (other) {
                console.log("Connecting to peer", other);
                const conn = peer.connect(other);
                conn.on("open", () => {
                    console.log("Connected to", other);
                    onUserConnected(conn);
                });
                conn.on("data", (data) => {
                    onReceivedMesssage(data);
                });
                conn.on("close", () => {
                    onOtherConnectionClosed(conn);
                });
            }
        });
        peer.on("error", (err) => {
            console.error("Peer error", err.message);
            peer.destroy();
            setTimeout(() => {
                return handleConnection(getCuteName(), room);
            }, 500);
        });
        peer.on("connection", (conn) => {
            onUserConnected(conn);
            conn.on("data", (data) => {
                onReceivedMesssage(data);
            });
            conn.on("close", () => {
                onOtherConnectionClosed(conn);
            });
        });
    }

    function __setRoom(id: string) {
        const url = new URL(location.href);
        url.searchParams.set("room", id);
        pushState(url.href, "");
    }

    function __sendMessage(evt: SubmitEvent) {
        evt.preventDefault();
        if (!message) return;
        const data = {
            id: peerId,
            message,
            color: hexColorFromString(peerId),
        };
        message = "";
        onReceivedMesssage(data);
        broadcast(data);
    }
    function broadcast(data: any) {
        for (const conn of connections) {
            conn.send(data);
        }
    }

    function onUserConnected(con: DataConnection) {
        connections.push(con);
        connectedIds.push(con.peer);
        connectedIds = connectedIds;
        console.log("User connections changed", connectedIds.length);
        if (connectedIds.length < 1) return;
        if (isHosting()) {
            generateNewGameCard();
            generatePlayerCard();
            setTimeout(() => {
                broadcast({ gameCard: currentGameCard });
            }, 1000);
        }
    }
    function onOtherConnectionClosed(con: DataConnection) {
        connections.filter((c) => c !== con);
        connectedIds = connectedIds.filter((id) => id !== con.peer);
        currentGameCard = new Array<string>();
    }
    function onReceivedMesssage(data: any) {
        if (!data) return;
        else if (typeof data === "object") {
            if ("id" in data && "message" in data) {
                messages.push(data as MessageObject);
                while (messages.length > 5) {
                    messages.shift();
                }
                messages = messages;
            } else if ("gameCard" in data) {
                currentGameCard = data.gameCard;
                if (playerCard.length === 0) generatePlayerCard();

                // not sure why this is not bound here. it works in the click event
                // if (!correctSource) {
                //     correctSource = document.getElementById(
                //         "correctsource",
                //     ) as HTMLAudioElement;
                // }
                // if (correctSource) {
                //     correctSource.currentTime = 0;
                //     correctSource.play();
                // }
            }
        }
    }

    function hexColorFromString(str: string) {
        let id = 0;
        for (let i = 0; i < str.length; i++) {
            id += str.charCodeAt(i);
        }
        return `#${(id & 0xffffff).toString(16)}`;
    }

    $: currentGameCard = new Array<string>();
    $: playerCard = new Array<string>();
    const gameSymbolsCount = 4;

    const symbols = new Array<string>();
    const availableCardsCount = 16;
    for (let i = 0; i < availableCardsCount; i++) {
        const number = i < 10 ? "0" + i : i;
        const path = base + "/cards/" + number + ".png";
        symbols.push(path);
    }
    function generateNewGameCard() {
        const cards = new Array<string>();
        const options = [...symbols];
        for (let i = 0; i < gameSymbolsCount; i++) {
            const index = Math.floor(Math.random() * options.length);
            cards.push(options[index]);
            options.splice(index, 1);
        }
        currentGameCard = cards;
        broadcast({ gameCard: currentGameCard });
    }
    function generatePlayerCard() {
        // make sure one symbol matches
        // make sure the other three are random
        const cards = new Array<string>();
        const options = [...symbols];
        for (let i = 0; i < gameSymbolsCount; i++) {
            const index = Math.floor(Math.random() * options.length);
            cards.push(options[index]);
            options.splice(index, 1);
        }
        // matching symbol
        const goal =
            currentGameCard[Math.floor(Math.random() * currentGameCard.length)];
        if (!cards.includes(goal)) {
            const matchIndex = Math.floor(Math.random() * cards.length);
            cards[matchIndex] = goal;
        }
        playerCard = cards;
    }

    const correctSound = base + "/correct.wav";
    const incorrectSound = base + "/wrong.wav";
    let correctSource!: HTMLAudioElement;
    let incorrectSource!: HTMLAudioElement;

    function onClickedCard(index: number) {
        const symbol = playerCard[index];
        if (currentGameCard.includes(symbol)) {
            generateNewGameCard();
            generatePlayerCard();
            correctSource.currentTime = 0;
            correctSource.play();
        } else {
            // that wasn't it
            incorrectSource.currentTime = 0;
            incorrectSource.play();
        }
    }

    function shareLink(evt?: Event) {
        evt?.preventDefault();
        const navigator = window.navigator;
        if (navigator.share) {
            navigator?.share({
                title: "Play a game with me",
                text: "I'd love to play a game with you. Click the link to join me.",
                url: location.href,
            });
        } else {
            navigator.clipboard.writeText(location.href);
            if (evt?.target instanceof HTMLElement)
                evt.target.innerText = "Link copied to clipboard";
        }
    }
</script>

<div class="page">
    {#if currentGameCard.length > 0}
        <Card symbols={currentGameCard} />
        <Card clicked={onClickedCard} symbols={playerCard} clickable />
        <audio
            id="correctsource"
            src={correctSound}
            bind:this={correctSource}
        />
        <audio src={incorrectSound} bind:this={incorrectSource} />
    {/if}

    {#if connectedIds.length > 0}
        <div class="meta text">
            You are <span
                class="name"
                style="color:{hexColorFromString(peerId)}">{peerId}</span
            >
            and you play against
            <span
                class="name"
                style="color:{hexColorFromString(connectedIds[0])}"
                >{connectedIds.join(", ")}</span
            >
        </div>
        <div class="chat">
            <div class="messages">
                {#each messages as msg, index}
                    <span style="color:{msg.color};opacity:{1}">{msg.message}</span>
                {/each}
            </div>
            <form on:submit|preventDefault={__sendMessage}>
                <input type="text" bind:value={message} />
                <button type="submit">Send</button>
            </form>
        </div>
    {:else}
        <p class="intro">
            Want to play?<br />
            <a class="share" href="/" on:click={shareLink}
                >Click & Send this link to a friend</a
            ><br />
            {#if room?.length}
                <small>You are in room {room}</small>
            {/if}
        </p>
    {/if}
</div>

<style>
    .page {
        padding: 1rem;
    }
    .intro {
        padding: 1rem 1.5rem;
        line-height: 2rem;
    }
    .intro small {
        color: rgba(0, 0, 0, 0.3);
    }
    .share {
        color: #f183cb;
        cursor: pointer;
        border-bottom: 3px dotted #f183cb55;
    }
    .share:hover {
        border-bottom: 0px;
    }
    .text {
        color: rgba(0, 0, 0, 0.2);
        line-height: 1.3rem;
        font-size: 1rem;
    }
    .name {
        font-weight: bold;
    }

    .chat {
        position: fixed;
        bottom: 0;
        right: 0;
        display: flex;
        align-items: flex-end;
        flex-direction: column;
        line-height: 1.3;
        padding: 0.5rem;
        margin: 1rem;
        pointer-events: none;
    }
    .chat button, .chat input {
        pointer-events: auto;
    }
    .chat button {
        color: black;
        background: rgb(200, 200, 100);
        cursor: pointer;
        font-size: 1.3rem;
    }
    .chat button:hover {
        background: rgb(220, 220, 0);
    }
    .chat .messages {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding-bottom: 1rem;
        text-align: right;
        line-height: 1rem;
    }
    .chat .messages span {
        background: white;
        padding: 0.5rem;
        border-radius: 0.5rem;
        z-index: 999;
    }
</style>
