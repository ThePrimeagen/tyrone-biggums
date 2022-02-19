const PLAYER_STARTING_X = 2500;
const BULLET_SPEED = 1;
let defaultConfig = {
    playerStartingX: PLAYER_STARTING_X,
    bulletSpeed: BULLET_SPEED,
    loserFireRate: 300,
    winnerFireRate: 180,
}

export function setConfig(config: PartialConfig) {
    defaultConfig = Object.assign({}, defaultConfig, config);
}

export type GameConfig = {
    playerStartingX: number;
    bulletSpeed: number;
    loserFireRate: number;
    winnerFireRate: number;
};

export type PartialConfig = {
    playerStartingX?: number;
    bulletSpeed?: number;
    loserFireRate?: number;
    winnerFireRate?: number;
};

export default function getConfig(): GameConfig {
    return defaultConfig;
}


