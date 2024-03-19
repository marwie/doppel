<script lang="ts">
    export let symbols = ["X", "O"];
    export let clicked: (index: number) => void = () => {};
    export let clickable = false;

    function handleClick(evt: Event) {
        console.log(evt.target?.textContent);
        const index = symbols.indexOf(evt.target?.textContent);
        clicked?.(index);
    }
</script>

<div class="card {clickable ? 'clickable' : 'not-clickable'}">
    {#each symbols as symbol}
        <button on:click={handleClick}>{symbol}</button>
    {/each}
</div>

<style>
    .card {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        margin: 1rem;
        border-radius: 5px;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
        gap: 1rem;
    }

    .card button {
        padding: 1rem;
        font-size: 2rem;
        border: none;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        width: 30%;
        max-width: 4rem;
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
