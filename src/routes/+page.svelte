<script lang="ts">
    import { browser } from "$app/environment";
    import { pushState } from "$app/navigation";
    import { onMount } from "svelte";
    import type { DataConnection } from "peerjs";
    import type Peer from "peerjs";

    $: peerId = "";
    $: messages = new Array<MessageObject>();
    $: connectedIds = new Array<string>();

    let message = "";

    let peer: Peer;
    const connections: DataConnection[] = [];

    type MessageObject = {
        id: string;
        message: string;
    };

    onMount(async () => {
        if (!browser) return;
        // timeout just because dev environment should give peer a moment to dispose the old connection
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
                    conn.send({
                        id: peerId,
                        message: "Hello",
                    });
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
                const randomPeerIdWithChars = Math.random()
                    .toString(36)
                    .substring(2);
                return handleConnection(randomPeerIdWithChars, room);
            }, 500);
        });
        peer.on("connection", (conn) => {
            console.log("New connection", conn.peer);
            connections.push(conn);
            connectedIds.push(conn.peer);
            connectedIds = connectedIds;
            conn.on("data", (data) => {
                onReceivedMesssage(data);
            });
            conn.on("close", () => {
                onOtherConnectionClosed(conn);
            });
        });
        function onOtherConnectionClosed(con: DataConnection) {
            connections.filter((c) => c !== con);
            connectedIds = connectedIds.filter((id) => id !== con.peer);
        }
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
        for (const conn of connections) {
            console.log("Sending message to", conn.peer);
            conn.send(data);
        }
    }
    function onReceivedMesssage(data: any) {
        if (!data) return;
        else if (
            typeof data === "object" &&
            "id" in data &&
            "message" in data
        ) {
            messages.push(data as MessageObject);
            while (messages.length > 20) {
                messages.shift();
            }
            messages = messages;
        }
    }
</script>

<p>
    My ID: {peerId}
</p>

<form on:submit|preventDefault={__sendMessage}>
    <input type="text" bind:value={message} />
    <button type="submit">Send</button>
</form>

<div>
    {#each messages as msg}
        <p>{msg.id}: {msg.message}</p>
    {/each}
</div>

<p>Connected to:</p>
<ul>
    {#each connectedIds as conn}
        <li>{conn}</li>
    {/each}
</ul>
