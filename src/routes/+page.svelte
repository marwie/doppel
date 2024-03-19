<script lang="ts">
    import { browser } from "$app/environment";
    import { pushState } from "$app/navigation";
    import { onMount } from "svelte";
    import type { DataConnection } from "peerjs";
    import type Peer from "peerjs";
    import Card from "../components/card.svelte";
    import { getCuteName } from "$lib/cute names";

    $: peerId = "";
    $: messages = new Array<MessageObject>();
    $: connectedIds = new Array<string>();
    const connections: DataConnection[] = [];

    let message = "";

    let peer: Peer;

    type MessageObject = {
        id: string;
        message: string;
    };

    onMount(async () => {
        if (!browser) return;
        // timeout just because dev environment should give peer a moment to dispose the old connection
        setTimeout(
            () => {
                let room = new URLSearchParams(location.search).get("room");
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
                while (messages.length > 10) {
                    messages.shift();
                }
                messages = messages;
            } else if ("gameCard" in data) {
                currentGameCard = data.gameCard;
                if (playerCard.length === 0) generatePlayerCard();
            }
        }
    }

    $: currentGameCard = new Array<string>();
    $: playerCard = new Array<string>();
    const symbols = [
        "X",
        "O",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
    ];
    function generateNewGameCard() {
        const selected = new Array<string>();
        const options = [...symbols];
        for (let i = 0; i < 4; i++) {
            const index = Math.floor(Math.random() * options.length);
            selected.push(options[index]);
            options.splice(index, 1);
        }
        currentGameCard = selected;
        broadcast({ gameCard: currentGameCard });
    }
    function generatePlayerCard() {
        // make sure one symbol matches
        // make sure the other three are random
        const selected = new Array<string>();
        const options = [...symbols];
        for (let i = 0; i < 4; i++) {
            const index = Math.floor(Math.random() * options.length);
            selected.push(options[index]);
            options.splice(index, 1);
        }
        // matching symbol
        const matchIndex = Math.floor(Math.random() * selected.length);
        selected[matchIndex] =
            currentGameCard[Math.floor(Math.random() * currentGameCard.length)];
        playerCard = selected;
    }

    function onClickedCard(index: number) {
        const symbol = playerCard[index];
        if (currentGameCard.includes(symbol)) {
            generateNewGameCard();
            generatePlayerCard();
        } else {
            // that wasn't it
        }
    }

    function shareLink(evt?: Event) {
        evt?.preventDefault();
        const navigator = window.navigator;
        if (navigator.share) {
            navigator?.share({
                title: "Play a game with me",
                text: "I'm playing a game with a friend. Join me!",
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
    {/if}

    {#if connectedIds.length > 0}
        <span>Playing with {connectedIds.join(", ")}. You are {peerId}</span>
        <h3>Chat</h3>
        <form on:submit|preventDefault={__sendMessage}>
            <input type="text" bind:value={message} />
            <button type="submit">Send</button>
        </form>
    {:else}
        <p>
            Want to play?<br />
            <a href="/" on:click={shareLink}>Send this link to a friend</a>
        </p>
    {/if}

    <div class="chat">
        {#each messages as msg}
            <span>{msg.id}: {msg.message}</span>
        {/each}
    </div>
</div>

<style>
    .page {
        padding: 1rem;
    }
    .chat {
        display: flex;
        flex-direction: column;
        line-height: 1.3;
    }
</style>
