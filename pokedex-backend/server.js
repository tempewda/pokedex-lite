const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
let favorites = [];

// ============ ROUTES ============

// Health check
app.get('/', (req, res) => {
    res.json({ 
        message: 'Pokedex API is running!',
        endpoints: {
            getAllFavorites: 'GET /api/favorites',
            addFavorite: 'POST /api/favorites',
            removeFavorite: 'DELETE /api/favorites/:id'
        }
    });
});

// Get all favorites
app.get('/api/favorites', (req, res) => {
    res.json({
        success: true,
        count: favorites.length,
        data: favorites
    });
});

// Add to favorites
app.post('/api/favorites', (req, res) => {
    const { id, name, sprite } = req.body;

    // Validate
    if (!id || !name) {
        return res.status(400).json({
            success: false,
            error: 'id and name are required'
        });
    }

    // Check duplicate
    if (favorites.find(f => f.id === id)) {
        return res.status(409).json({
            success: false,
            error: 'Already in favorites'
        });
    }

    // Add it
    const newFav = { id, name, sprite, addedAt: new Date().toISOString() };
    favorites.push(newFav);

    res.status(201).json({
        success: true,
        message: `${name} added to favorites!`,
        data: newFav
    });
});

// Remove from favorites
app.delete('/api/favorites/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = favorites.findIndex(f => f.id === id);

    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: 'Not found in favorites'
        });
    }

    const removed = favorites.splice(index, 1)[0];

    res.json({
        success: true,
        message: `${removed.name} removed from favorites`,
        data: removed
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
