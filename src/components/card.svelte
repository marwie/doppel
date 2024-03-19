<script lang="ts">
    export let symbols = ["X", "O"];
    export let clicked: (index: number) => void = () => {};

    function handleClick(evt: Event) {
        console.log(evt.target?.textContent);
        const index = symbols.indexOf(evt.target?.textContent);
        clicked?.(index);
    }
</script>

<div class="card">
    {#each symbols as symbol}
        <button on:click={handleClick}>{symbol}</button>
    {/each}
</div>

<style>
    .card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        margin: 1rem;
        border: 1px solid #000;
        border-radius: 5px;
        box-shadow: 0 0 5px 0 #000;
    }
</style>
