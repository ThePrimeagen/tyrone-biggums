package gameloop

var Game_updateStateFromMessageQueue = (*Game).updateStateFromMessageQueue
var Game_startGame = (*Game).startGame
var Game_checkBulletCollisions = (*Game).checkBulletCollisions
var Game_updateBulletPositions = (*Game).updateBulletPositions
var Game_checkForBulletPlayerCollisions = (*Game).checkForBulletPlayerCollisions

func GetGameBullets(game *Game) []*Bullet {
    return game.bullets
}

