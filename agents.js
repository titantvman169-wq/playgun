// Valorant-style agent definitions: name, role, color, abilities (E, Q, R)
window.AGENTS = [
  {
    id: 'phoenix',
    name: 'Phoenix',
    role: 'Duelist',
    color: '#ff6b35',
    desc: 'Self-heal and damage boost',
    abilities: [
      { key: 'E', name: 'Heal', cooldown: 8, type: 'heal', value: 30 },
      { key: 'Q', name: 'Flash', cooldown: 6, type: 'speed', value: 1.4, duration: 2 },
      { key: 'R', name: 'Overdrive', cooldown: 25, type: 'damage_boost', value: 1.5, duration: 5 },
    ],
  },
  {
    id: 'jett',
    name: 'Jett',
    role: 'Duelist',
    color: '#00f5ff',
    desc: 'Dash and rapid fire',
    abilities: [
      { key: 'E', name: 'Dash', cooldown: 7, type: 'dash', value: 120 },
      { key: 'Q', name: 'Updraft', cooldown: 5, type: 'speed', value: 1.3, duration: 2 },
      { key: 'R', name: 'Bladestorm', cooldown: 20, type: 'rapid_fire', duration: 3 },
    ],
  },
  {
    id: 'sage',
    name: 'Sage',
    role: 'Sentinel',
    color: '#39ff14',
    desc: 'Slow zone and full heal',
    abilities: [
      { key: 'E', name: 'Barrier', cooldown: 10, type: 'shield', value: 40 },
      { key: 'Q', name: 'Slow Orb', cooldown: 9, type: 'slow_zone', radius: 80, duration: 3 },
      { key: 'R', name: 'Resurrection', cooldown: 30, type: 'full_heal', value: 100 },
    ],
  },
  {
    id: 'viper',
    name: 'Viper',
    role: 'Controller',
    color: '#aa00ff',
    desc: 'Poison cloud and shield break',
    abilities: [
      { key: 'E', name: 'Poison Cloud', cooldown: 8, type: 'damage_zone', radius: 70, damage: 8, duration: 4 },
      { key: 'Q', name: 'Toxic Screen', cooldown: 6, type: 'shield', value: 25 },
      { key: 'R', name: 'Viper\'s Pit', cooldown: 22, type: 'damage_boost', value: 1.4, duration: 6 },
    ],
  },
  {
    id: 'reyna',
    name: 'Reyna',
    role: 'Duelist',
    color: '#ff00aa',
    desc: 'Lifesteal and invisibility',
    abilities: [
      { key: 'E', name: 'Devour', cooldown: 10, type: 'heal', value: 40 },
      { key: 'Q', name: 'Dismiss', cooldown: 12, type: 'invis', duration: 2 },
      { key: 'R', name: 'Empress', cooldown: 28, type: 'damage_boost', value: 1.35, duration: 5 },
    ],
  },
  {
    id: 'cypher',
    name: 'Cypher',
    role: 'Sentinel',
    color: '#ffaa00',
    desc: 'Reveal and extra damage',
    abilities: [
      { key: 'E', name: 'Spycam', cooldown: 9, type: 'shield', value: 35 },
      { key: 'Q', name: 'Trap', cooldown: 7, type: 'slow_zone', radius: 60, duration: 2.5 },
      { key: 'R', name: 'Neural Theft', cooldown: 24, type: 'damage_boost', value: 1.5, duration: 4 },
    ],
  },
];
