package gameloop

var Game_updateStateFromMessageQueue = (*Game).updateStateFromMessageQueue
var Game_startGame = (*Game).startGame

func GetGameBullets(game *Game) []Bullet {
    return game.bullets
}

