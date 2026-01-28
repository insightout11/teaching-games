import React from 'react';
import type { Game } from '../games/schema';

interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
}

export function GameCard({ game, onSelect }: GameCardProps) {
  const categoryIcons: Record<string, string> = {
    warmup: '🔥',
    lesson: '📚',
    activity: '🎯',
    closer: '🎬',
  };

  return (
    <div
      style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onClick={() => onSelect(game)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <span style={{ fontSize: '2rem' }}>{categoryIcons[game.category] || '🎮'}</span>
        <div>
          <h3 style={{ color: '#2563eb', margin: 0 }}>{game.name}</h3>
          <span style={{ fontSize: '0.85rem', color: '#6b7280', textTransform: 'capitalize' }}>
            {game.category}
          </span>
        </div>
      </div>
      <p style={{ color: '#4b5563', margin: 0, fontSize: '0.95rem' }}>{game.description}</p>
      <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#6b7280' }}>
        ⏱️ ~{game.output.metadata?.estimatedDuration || 60}s per round
      </div>
    </div>
  );
}

interface GameGridProps {
  games: Game[];
  onSelectGame: (game: Game) => void;
}

export function GameGrid({ games, onSelectGame }: GameGridProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: '20px',
      padding: '20px 0',
    }}>
      {games.map(game => (
        <GameCard key={game.id} game={game} onSelect={onSelectGame} />
      ))}
    </div>
  );
}
