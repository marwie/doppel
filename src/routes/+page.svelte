<script lang="ts">
    import { browser } from "$app/environment";
    import { pushState } from "$app/navigation";
    import { onMount } from "svelte";
    import type { DataConnection } from "peerjs";
    import type Peer from "peerjs";

    $: peerId = "";
    $: messages = [];
    $: connectedIds = new Array<string>();

    let message = "";

    let peer: Peer;
    let connections: DataConnection[] = [];

    onMount(async () => {
        if (!browser) return;
        setTimeout(() => {
            let room = new URLSearchParams(location.search).get("room");
            if (!room) {
                room = Math.random().toString(36).substring(2);
                __setRoom(room);
            }
            handleConnection(room, null);
        }, 1000);
    });

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
                    connections.push(conn);
                    connectedIds.push(conn.peer);
                    connectedIds = connectedIds;
                });
            }
        });
        peer.on("error", (err) => {
            console.error("Peer error", err.message);
            peer.destroy();
            setTimeout(() => {
                const randomPeerIdWithChars = Math.random()
                    .toString(36)
                    .substring(2);
                return handleConnection(randomPeerIdWithChars, room);
            }, 100);
        });
        peer.on("connection", (conn) => {
            console.log("New connection", conn.peer);
            connections.push(conn);
            connectedIds.push(conn.peer);
            connectedIds = connectedIds;

            conn.on("data", (data) => {
                console.log("Received data", data);
                // messages.push(data);
                // messages = messages;
            });
            conn.on("close", () => {
                onOtherConnectionClosed(conn);
            });
        });
        function onOtherConnectionClosed(con: DataConnection) {
            const id = con.peer;
            connections = connections.filter((c) => c !== con);
            connectedIds = connectedIds.filter((id) => id !== con.peer);
        }
    }

    function __setRoom(id: string) {
        const url = new URL(location.href);
        url.searchParams.set("room", id);
        pushState(url.href, "");
    }

    function __sendMessage() {}
</script>

<h1>Welcome to SvelteKit</h1>
<p>
    {peerId}
</p>

<form on:submit|preventDefault={__sendMessage}>
    <input type="text" bind:value={message} />
    <button type="submit">Send</button>
</form>

<ul>
    {#each messages as message}
        <li>{message}</li>
    {/each}
</ul>

<ul>
    {#each connectedIds as conn}
        <li>{conn}</li>
    {/each}
</ul>
