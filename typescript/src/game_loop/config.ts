const PLAYER_STARTING_X = 2500;
const BULLET_SPEED = 1;
const defaultConfig = {
    playerStartingX: PLAYER_STARTING_X,
    bulletSpeed: BULLET_SPEED
}

export type GameConfig = {
    playerStartingX: number;
    bulletSpeed: number;
};

export type PartialConfig = {
    playerStartingX?: number;
    bulletSpeed?: number;
};

export default function createConfig(config?: PartialConfig): GameConfig {
    return Object.assign({}, defaultConfig, config);
}


