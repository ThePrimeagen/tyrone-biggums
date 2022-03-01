package gameloop

var Game_updateStateFromMessageQueue = (*Game).updateStateFromMessageQueue
var Game_startGame = (*Game).startGame
var Game_checkBulletCollisions = (*Game).checkBulletCollisions
var Game_updateBulletPositions = (*Game).updateBulletPositions

func GetGameBullets(game *Game) []*Bullet {
    return game.bullets
}

