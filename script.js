// ========================================
// POKEDEX LITE - Main Application Script
// ========================================

// API Configuration
const POKE_API = 'https://pokeapi.co/api/v2/pokemon';
const BACKEND_API = 'https://your-backend-url.azurewebsites.net'; // UPDATE THIS!
const MAX_POKEMON = 1010;

// State Management
let currentPokemonId = null;
let currentPokemonData = null;
let isShiny = false;
let favorites = []; // Track favorites

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
    cryBtn: document.getElementById('cry-btn'),
    favBtn: document.getElementById('fav-btn'),         // NEW
    favList: document.getElementById('favorites-list')   // NEW
};

// Stat name mappings
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
    elements.welcomeState.classList.add('hidden');
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
    elements.pokemonCard.classList.add('hidden');
    
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
    
    // Update favorite button state
    if (elements.favBtn) {
        elements.favBtn.disabled = !hasPokemon;
        updateFavoriteButton();
    }
}

// ========================================
// BACKEND API Functions (NEW!)
// ========================================

async function fetchFavorites() {
    try {
        const response = await fetch(`${BACKEND_API}/api/favorites`);
        const data = await response.json();
        if (data.success) {
            favorites = data.data;
            renderFavoritesList();
        }
    } catch (error) {
        console.error('Failed to fetch favorites:', error);
    }
}

async function addToFavorites() {
    if (!currentPokemonData) return;
    
    const pokemon = {
        id: currentPokemonData.id,
        name: currentPokemonData.name,
        sprite: currentPokemonData.sprites.front_default
    };
    
    try {
        const response = await fetch(`${BACKEND_API}/api/favorites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pokemon)
        });
        
        const data = await response.json();
        
        if (data.success) {
            favorites.push(data.data);
            updateFavoriteButton();
            renderFavoritesList();
            showNotification(`${pokemon.name.toUpperCase()} added to favorites!`);
        } else {
            showNotification(data.error, 'error');
        }
    } catch (error) {
        console.error('Failed to add favorite:', error);
        showNotification('Failed to add to favorites', 'error');
    }
}

async function removeFromFavorites(id) {
    try {
        const response = await fetch(`${BACKEND_API}/api/favorites/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            favorites = favorites.filter(f => f.id !== id);
            updateFavoriteButton();
            renderFavoritesList();
            showNotification(`${data.data.name.toUpperCase()} removed from favorites`);
        }
    } catch (error) {
        console.error('Failed to remove favorite:', error);
    }
}

function isFavorite(id) {
    return favorites.some(f => f.id === id);
}

function updateFavoriteButton() {
    if (!elements.favBtn || !currentPokemonData) return;
    
    if (isFavorite(currentPokemonData.id)) {
        elements.favBtn.textContent = '❤️';
        elements.favBtn.classList.add('active');
        elements.favBtn.title = 'Remove from favorites';
    } else {
        elements.favBtn.textContent = '🤍';
        elements.favBtn.classList.remove('active');
        elements.favBtn.title = 'Add to favorites';
    }
}

function renderFavoritesList() {
    if (!elements.favList) return;
    
    if (favorites.length === 0) {
        elements.favList.innerHTML = '<p class="no-favorites">No favorites yet!</p>';
        return;
    }
    
    elements.favList.innerHTML = favorites.map(fav => `
        <div class="favorite-item" data-id="${fav.id}">
            <img src="${fav.sprite}" alt="${fav.name}" width="40" height="40">
            <span>${fav.name.toUpperCase()}</span>
            <button class="remove-fav" onclick="removeFromFavorites(${fav.id})">✕</button>
        </div>
    `).join('');
}

function toggleFavorite() {
    if (!currentPokemonData) return;
    
    if (isFavorite(currentPokemonData.id)) {
        removeFromFavorites(currentPokemonData.id);
    } else {
        addToFavorites();
    }
}

// Simple notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ========================================
// PokeAPI Functions
// ========================================

async function fetchPokemon(query) {
    const cleanQuery = String(query).toLowerCase().trim();
    
    if (!cleanQuery) return null;
    
    try {
        const response = await fetch(`${POKE_API}/${cleanQuery}`);
        if (!response.ok) throw new Error('Pokemon not found');
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
    
    updateSprite();
    
    elements.pokemonNumber.textContent = `#${String(pokemon.id).padStart(3, '0')}`;
    elements.pokemonName.textContent = pokemon.name.toUpperCase();
    
    displayTypes(pokemon.types);
    displayStats(pokemon.stats);
    
    elements.pokemonHeight.textContent = `${(pokemon.height / 10).toFixed(1)}m`;
    elements.pokemonWeight.textContent = `${(pokemon.weight / 10).toFixed(1)}kg`;
    
    updateNavigationButtons();
    elements.shinyBtn.classList.remove('active');
    
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
    
    showState('loading');
    
    const pokemon = await fetchPokemon(query);
    
    if (pokemon) {
        displayPokemon(pokemon);
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
    
    elements.pokemonSprite.style.animation = 'none';
    setTimeout(() => {
        elements.pokemonSprite.style.animation = 'fadeIn 0.3s ease';
    }, 10);
}

// ========================================
// Sound Effects
// ========================================

function playClickSound() {
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
        // Audio not supported
    }
}

// ========================================
// Event Listeners
// ========================================

elements.searchBtn.addEventListener('click', handleSearch);

elements.searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

elements.prevBtn.addEventListener('click', handlePrev);
elements.nextBtn.addEventListener('click', handleNext);
elements.shinyBtn.addEventListener('click', toggleShiny);
elements.cryBtn.addEventListener('click', playCry);

// Favorite button listener (NEW!)
if (elements.favBtn) {
    elements.favBtn.addEventListener('click', toggleFavorite);
}

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
        case 'f':
        case 'F':
            toggleFavorite();
            break;
    }
});

// ========================================
// Initialize
// ========================================

function init() {
    showState('welcome');
    updateNavigationButtons();
    fetchFavorites(); // Load favorites from backend on startup
}

init();
