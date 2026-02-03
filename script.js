// ========================================
// POKEDEX LITE - Main Application Script
// ========================================

// API Configuration
const POKE_API = 'https://pokeapi.co/api/v2/pokemon';
const MAX_POKEMON = 1010; // Total Pokemon available

// State Management
let currentPokemonId = null;
let currentPokemonData = null;
let isShiny = false;

// DOM Elements
const elements = {
    // States
    welcomeState: document.getElementById('welcome-state'),
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    pokemonCard: document.getElementById('pokemon-card'),
    
    // Search
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    
    // Pokemon Display
    pokemonSprite: document.getElementById('pokemon-sprite'),
    pokemonNumber: document.getElementById('pokemon-number'),
    pokemonName: document.getElementById('pokemon-name'),
    pokemonTypes: document.getElementById('pokemon-types'),
    statsSection: document.getElementById('stats-section'),
    pokemonHeight: document.getElementById('pokemon-height'),
    pokemonWeight: document.getElementById('pokemon-weight'),
    
    // Controls
    shinyBtn: document.getElementById('shiny-btn'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    cryBtn: document.getElementById('cry-btn')
};

// Stat name mappings for display
const STAT_NAMES = {
    'hp': 'HP',
    'attack': 'ATK',
    'defense': 'DEF',
    'special-attack': 'SPA',
    'special-defense': 'SPD',
    'speed': 'SPE'
};

// ========================================
// UI State Management
// ========================================

function showState(state) {
    // Hide all states
    elements.welcomeState.classList.add('hidden');
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.pokemonCard.classList.add('hidden');
    
    // Show requested state
    switch(state) {
        case 'welcome':
            elements.welcomeState.classList.remove('hidden');
            break;
        case 'loading':
            elements.loadingState.classList.remove('hidden');
            break;
        case 'error':
            elements.errorState.classList.remove('hidden');
            break;
        case 'pokemon':
            elements.pokemonCard.classList.remove('hidden');
            break;
    }
}

function updateNavigationButtons() {
    const hasPokemon = currentPokemonId !== null;
    
    elements.prevBtn.disabled = !hasPokemon || currentPokemonId <= 1;
    elements.nextBtn.disabled = !hasPokemon || currentPokemonId >= MAX_POKEMON;
    elements.cryBtn.disabled = !hasPokemon;
}

// ========================================
// API Functions
// ========================================

async function fetchPokemon(query) {
    // Clean up the query
    const cleanQuery = String(query).toLowerCase().trim();
    
    if (!cleanQuery) {
        return null;
    }
    
    try {
        const response = await fetch(`${POKE_API}/${cleanQuery}`);
        
        if (!response.ok) {
            throw new Error('Pokemon not found');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

// ========================================
// Display Functions
// ========================================

function displayPokemon(pokemon) {
    currentPokemonData = pokemon;
    currentPokemonId = pokemon.id;
    isShiny = false;
    
    // Update sprite
    updateSprite();
    
    // Update basic info
    elements.pokemonNumber.textContent = `#${String(pokemon.id).padStart(3, '0')}`;
    elements.pokemonName.textContent = pokemon.name.toUpperCase();
    
    // Update types
    displayTypes(pokemon.types);
    
    // Update stats
    displayStats(pokemon.stats);
    
    // Update measurements
    elements.pokemonHeight.textContent = `${(pokemon.height / 10).toFixed(1)}m`;
    elements.pokemonWeight.textContent = `${(pokemon.weight / 10).toFixed(1)}kg`;
    
    // Update UI state
    updateNavigationButtons();
    elements.shinyBtn.classList.remove('active');
    
    // Show pokemon card
    showState('pokemon');
}

function updateSprite() {
    if (!currentPokemonData) return;
    
    const sprites = currentPokemonData.sprites;
    let spriteUrl;
    
    if (isShiny) {
        spriteUrl = sprites.other['official-artwork'].front_shiny || 
                   sprites.front_shiny ||
                   sprites.other['official-artwork'].front_default;
    } else {
        spriteUrl = sprites.other['official-artwork'].front_default || 
                   sprites.front_default;
    }
    
    elements.pokemonSprite.src = spriteUrl || '';
    elements.pokemonSprite.alt = `${currentPokemonData.name} sprite`;
}

function displayTypes(types) {
    elements.pokemonTypes.innerHTML = types
        .map(typeInfo => {
            const typeName = typeInfo.type.name;
            return `<span class="type-badge type-${typeName}">${typeName}</span>`;
        })
        .join('');
}

function displayStats(stats) {
    elements.statsSection.innerHTML = stats
        .map(statInfo => {
            const statName = STAT_NAMES[statInfo.stat.name] || statInfo.stat.name;
            const statValue = statInfo.base_stat;
            const percentage = Math.min((statValue / 150) * 100, 100);
            
            // Determine bar color class
            let barClass = 'low';
            if (statValue >= 80) barClass = 'high';
            else if (statValue >= 50) barClass = 'medium';
            
            return `
                <div class="stat-row">
                    <span class="stat-label">${statName}</span>
                    <div class="stat-bar-container">
                        <div class="stat-bar ${barClass}" style="width: ${percentage}%"></div>
                    </div>
                    <span class="stat-value">${statValue}</span>
                </div>
            `;
        })
        .join('');
}

// ========================================
// Audio Functions
// ========================================

function playCry() {
    if (!currentPokemonData) return;
    
    const cryUrl = currentPokemonData.cries?.latest || currentPokemonData.cries?.legacy;
    
    if (cryUrl) {
        const audio = new Audio(cryUrl);
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
}

// ========================================
// Search Handler
// ========================================

async function handleSearch() {
    const query = elements.searchInput.value.trim();
    
    if (!query) {
        showState('welcome');
        return;
    }
    
    // Show loading
    showState('loading');
    
    // Fetch Pokemon
    const pokemon = await fetchPokemon(query);
    
    if (pokemon) {
        displayPokemon(pokemon);
        // Play a small click sound effect (optional enhancement)
        playClickSound();
    } else {
        showState('error');
        currentPokemonId = null;
        currentPokemonData = null;
        updateNavigationButtons();
    }
}

// ========================================
// Navigation Handlers
// ========================================

async function handlePrev() {
    if (currentPokemonId && currentPokemonId > 1) {
        elements.searchInput.value = currentPokemonId - 1;
        await handleSearch();
    }
}

async function handleNext() {
    if (currentPokemonId && currentPokemonId < MAX_POKEMON) {
        elements.searchInput.value = currentPokemonId + 1;
        await handleSearch();
    }
}

// ========================================
// Shiny Toggle Handler
// ========================================

function toggleShiny() {
    if (!currentPokemonData) return;
    
    isShiny = !isShiny;
    elements.shinyBtn.classList.toggle('active', isShiny);
    updateSprite();
    
    // Add sparkle animation
    elements.pokemonSprite.style.animation = 'none';
    setTimeout(() => {
        elements.pokemonSprite.style.animation = 'fadeIn 0.3s ease';
    }, 10);
}

// ========================================
// Sound Effects (Optional Enhancement)
// ========================================

function playClickSound() {
    // Create a simple beep using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
        // Audio not supported, fail silently
    }
}

// ========================================
// Event Listeners
// ========================================

// Search functionality
elements.searchBtn.addEventListener('click', handleSearch);

elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

// Navigation
elements.prevBtn.addEventListener('click', handlePrev);
elements.nextBtn.addEventListener('click', handleNext);

// Shiny toggle
elements.shinyBtn.addEventListener('click', toggleShiny);

// Play cry
elements.cryBtn.addEventListener('click', playCry);

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (document.activeElement === elements.searchInput) return;
    
    switch(e.key) {
        case 'ArrowLeft':
            handlePrev();
            break;
        case 'ArrowRight':
            handleNext();
            break;
        case 's':
        case 'S':
            toggleShiny();
            break;
    }
});

// ========================================
// Initialize
// ========================================

function init() {
    showState('welcome');
    updateNavigationButtons();
    
    // Load a random Pokemon as a fun start (optional)
    // Uncomment the next lines to auto-load a Pokemon on startup
    // const randomId = Math.floor(Math.random() * 151) + 1; // Gen 1
    // elements.searchInput.value = randomId;
    // handleSearch();
}

// Start the app
init();