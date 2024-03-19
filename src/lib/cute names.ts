

const cuteAnimalNames = [
    'Bunny',
    'Puppy',
    'Kitty',
    'Ducky',
    'Piglet',
    'Teddy Bear',
    'Panda',
    'Penguin',
    'Bambi',
    'Chipmunk',
];

const adjectives = [
    'Cuddly',
    'Fluffy',
    'Snuggly',
    'Fuzzy',
    'Soft',
    'Warm',
    'Cozy',
    'Sweet',
    'Gentle',
    'Delicate',
];

export function getCuteName() {
    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomAnimal = cuteAnimalNames[Math.floor(Math.random() * cuteAnimalNames.length)];
    let name = `${randomAdjective} ${randomAnimal}`;
    name = name.toLowerCase();
    name = name.replaceAll(' ', '-');
    return name;
}