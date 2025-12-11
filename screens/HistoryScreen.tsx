import React from 'react';
import { GameRecord, Screen } from '../types';
import { ChevronLeft, Trophy, Frown, Minus } from 'lucide-react';

interface HistoryScreenProps {
  history: GameRecord[];
  setScreen: (screen: Screen) => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, setScreen }) => {
  return (
    <div className="flex flex-col h-full bg-background animate-fade-in">
      <div className="p-4 flex items-center bg-panel border-b border-gray-800 sticky top-0 z-20">
        <button onClick={() => setScreen(Screen.HOME)} className="text-textMuted hover:text-white mr-4">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-title text-white text-lg">Game History</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-textMuted opacity-50">
                <Trophy size={48} className="mb-2" />
                <p>No games played yet.</p>
            </div>
        ) : (
            history.map((game) => (
                <div key={game.id} className="bg-panel border border-gray-800 rounded-xl p-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center
                            ${game.result === 'WIN' ? 'bg-gold/20 text-gold' : game.result === 'LOSS' ? 'bg-danger/20 text-danger' : 'bg-gray-700 text-gray-400'}
                        `}>
                            {game.result === 'WIN' ? <Trophy size={18} /> : game.result === 'LOSS' ? <Frown size={18} /> : <Minus size={18} />}
                        </div>
                        <div>
                            <p className="text-xs text-textMuted font-digital">{game.date}</p>
                            <p className="text-white font-bold text-sm">
                                {game.result === 'WIN' ? 'VICTORY' : game.result === 'LOSS' ? 'DEFEAT' : 'DRAW'}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`font-digital font-bold text-lg ${game.result === 'WIN' ? 'text-neon' : 'text-gray-500'}`}>
                            {game.result === 'WIN' ? `+${(game.betAmount).toLocaleString()}` : `-${game.betAmount.toLocaleString()}`}
                        </p>
                        <p className="text-[10px] text-textMuted">
                            Score: {game.userScore} - {game.opponentScore}
                        </p>
                    </div>
                </div>
            )).reverse()
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;