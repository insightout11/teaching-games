import React, { useState } from 'react';
import { games, type Game } from './games/schema';
import { GameGrid } from './components/GameCard';

function App() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [view, setView] = useState<'library' | 'config'>('library');

  const handleSelectGame = (game: Game) => {
    setSelectedGame(game);
    setView('config');
  };

  const handleBack = () => {
    setView('library');
    setSelectedGame(null);
  };

  if (view === 'config' && selectedGame) {
    return (
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
        <button
          onClick={handleBack}
          style={{
            background: 'none',
            border: 'none',
            color: '#2563eb',
            cursor: 'pointer',
            fontSize: '1rem',
            marginBottom: '20px',
          }}
        >
          ← Back to Library
        </button>
        <h1 style={{ marginBottom: '10px' }}>{selectedGame.name}</h1>
        <p style={{ color: '#6b7280', marginBottom: '30px' }}>{selectedGame.description}</p>

        <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Configure Game</h2>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedGame.inputs.map(input => (
            <div key={input.key}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
                {input.label}
                {input.required && <span style={{ color: '#ef4444' }}> *</span>}
              </label>
              {input.type === 'text' && (
                <input
                  type="text"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                  }}
                  placeholder={`Enter ${input.label.toLowerCase()}`}
                />
              )}
              {input.type === 'select' && (
                <select
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                  }}
                >
                  {input.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
              {input.type === 'range' && input.options && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="range"
                    min={0}
                    max={input.options.length - 1}
                    defaultValue={2}
                    style={{ flex: 1 }}
                  />
                  <span style={{ minWidth: '60px', textAlign: 'right' }}>
                    {input.options[2]}s
                  </span>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={() => alert('Game would start here!')}
            style={{
              background: '#2563eb',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              marginTop: '20px',
            }}
          >
            Start Game →
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Teaching Games</h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          AI Speaking Activities for ESL Teachers
        </p>
      </header>

      <section>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '20px' }}>Game Library</h2>
        <GameGrid games={games} onSelectGame={handleSelectGame} />
      </section>
    </div>
  );
}

export default App;
