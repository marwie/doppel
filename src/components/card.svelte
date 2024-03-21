<script lang="ts">
    import { onMount } from "svelte";

    export let symbols = ["X", "O"];
    export let clicked: (index: number) => void = () => {};
    export let clickable = false;

    function handleClick(evt: Event) {
        if (evt.target && evt.target instanceof HTMLElement) {
            const index = parseInt(evt.target.dataset.index || "-1");
            console.log("clicked", index);
            clicked?.(index);
        }
    }

    onMount(() => {
        updateRotations();
    });

    $: getSymbols = () => {
        return symbols;
    };
    $: randomRotations = new Array<number>();
    $: randomScales = new Array<number>();
    function updateRotations() {
        randomRotations.length = symbols.length;
        randomScales.length = symbols.length;
        for (let i = 0; i < symbols.length; i++) {
            randomRotations[i] = Math.random() * Math.PI * 2;
            randomScales[i] = 0.5 + Math.random() * 0.5;
        }
    }
</script>

<div class="card {clickable ? 'clickable' : 'not-clickable'}">
    {#each symbols as symbol, index}
        <button on:click={handleClick} data-index={index}>
            <div
                style="transform: rotate({randomRotations[index]}rad) scale({randomScales[index]});"
            >
                <img alt="card symbol" src={symbol} />
            </div>
        </button>
    {/each}
</div>

<style>
    .card {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        padding: 1rem;
        margin: 2rem;
        border-radius: 5px;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
        gap: 1rem;
    }

    .card img {
        width: 100%;
        height: auto;
    }

    .card button {
        padding: 0rem;
        font-size: 2rem;
        border: none;
        border-radius: 1rem;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        width: 40%;
        max-width: 20vh;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .card button > * {
        pointer-events: none;
    }

    .card.not-clickable button {
        pointer-events: none;
        box-shadow: none;
        background-color: rgba(220, 220, 220, 1);
        color: black;
    }
    .card.clickable button {
        background: black;
        color: white;
        cursor: pointer;
    }
    .card.card.clickable button:hover {
        background: white;
        color: black;
    }
</style>
