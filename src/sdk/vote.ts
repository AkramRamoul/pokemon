import { Redis } from "@upstash/redis";
import { getAllPokemon } from "./pokeapi";

// Initialize Upstash Redis
const redis = new Redis({
  url: process.env.KV_REST_API_URL!, // Replace with your Upstash Redis URL
  token: process.env.KV_REST_API_TOKEN!, // Replace with your Upstash Redis token
});

export const recordBattle = async (winner: number, loser: number) => {
  const recordPromises = Promise.all([
    // Record battle
    redis.lpush(
      "battles:all",
      JSON.stringify({
        winner,
        loser,
        timestamp: Date.now(),
      })
    ),

    // Increment win/loss counters
    redis.incr(`pokemon:${winner}:wins`),
    redis.incr(`pokemon:${loser}:losses`),
  ]);

  await recordPromises;
};

export async function getRankings() {
  const pokemonList = await getAllPokemon();

  // Construct win/loss keys directly from pokemon list
  const winKeys = pokemonList.map((p) => `pokemon:${p.dexNumber}:wins`);
  const lossKeys = pokemonList.map((p) => `pokemon:${p.dexNumber}:losses`);

  // Fetch all wins and losses
  const [wins, losses] = await Promise.all([
    redis.mget<number[]>(...winKeys),
    redis.mget<number[]>(...lossKeys),
  ]);

  const stats = pokemonList.map((pokemon, index) => {
    const totalWins = wins[index] ?? 0;
    const totalLosses = losses[index] ?? 0;
    const totalBattles = totalWins + totalLosses;

    return {
      ...pokemon,
      stats: {
        wins: totalWins,
        losses: totalLosses,
        winRate: totalBattles > 0 ? totalWins / totalBattles : 0,
      },
    };
  });

  return stats.sort((a, b) => {
    const winRateDiff = b.stats.winRate - a.stats.winRate;
    if (winRateDiff !== 0) return winRateDiff;
    return b.stats.wins - a.stats.wins;
  });
}
