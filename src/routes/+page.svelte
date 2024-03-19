<script lang="ts">
    import Peer from "peerjs";
    import { onMount } from "svelte";

    onMount(() => {
        const room = new URLSearchParams(location.search).get("room");
        console.log(room);
        const peer = new Peer();
        peer.on("open", (id) => {
            console.log("My peer ID is: " + id);
        });
    });
</script>

<h1>Welcome to SvelteKit</h1>
<p>
    Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>
