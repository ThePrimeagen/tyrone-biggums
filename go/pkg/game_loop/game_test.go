package gameloop_test

import (
	"testing"
	"time"

	gameloop "github.com/ThePrimeagen/tyrone-biggums/pkg/game_loop"
	"github.com/ThePrimeagen/tyrone-biggums/pkg/server"
)

func TestWaitForReady(t *testing.T) {

	_, sockets, _ := NewGameComponents()

	waitForReadyDone := gameloop.WaitForReady(sockets[0], sockets[1])

	msg := <-sockets[0].outBound
	msg2 := <-sockets[1].outBound

	if msg.Message.Type != server.ReadyUp {
		t.Errorf("msg1 type isn't readyup %d %+v", server.ReadyUp, msg)
	}

	if msg2.Message.Type != server.ReadyUp {
		t.Errorf("msg2 type isn't readyup %d %+v", server.ReadyUp, msg2)
	}

	readyMessage := server.CreateMessage(server.ReadyUp)
	sockets[0].inBound <- readyMessage
	sockets[1].inBound <- readyMessage

	select {
	case <-waitForReadyDone:
	case <-time.After(1 * time.Second):
		t.Error("1 second elapsed without waitForReadyDone ")
	}
}

func TestMessageQueueFire(t *testing.T) {

	// TODO: This doesn't feel right... utils... test..?
	game, sockets, _ := NewGameComponents()

	gameloop.Game_startGame(game)

	fire := server.CreateMessage(server.Fire)
	sockets[0].inBound <- fire
	sockets[1].inBound <- fire

	// TODO: LEET CODER
	time.Sleep(time.Millisecond)

	gameloop.Game_updateStateFromMessageQueue(game)
	bullets := gameloop.GetGameBullets(game)

	if len(bullets) != 2 {
		t.Errorf("Expected to have 2 bullet but got %v", len(bullets))
	}

	sockets[0].inBound <- fire
	sockets[1].inBound <- fire

	gameloop.Game_updateStateFromMessageQueue(game)
	bullets = gameloop.GetGameBullets(game)

	if len(bullets) != 2 {
		t.Errorf("Expected to have 2 bullet but got %v", len(bullets))
	}
}

func TestBulletUpdate(t *testing.T) {

	// TODO: This doesn't feel right... utils... test..?
	game, sockets, _ := NewGameComponents()

	gameloop.Game_startGame(game)

	fire := server.CreateMessage(server.Fire)
	sockets[0].inBound <- fire
	sockets[1].inBound <- fire

	// TODO: I AM THE BEST PROGRAMMER EVER BECAUSE I USE SLEEP IN TESTS
	time.Sleep(time.Millisecond)

	gameloop.Game_updateStateFromMessageQueue(game)

	bullets := gameloop.GetGameBullets(game)

	x0 := bullets[0].Geo.X
	y0 := bullets[0].Geo.Y
	x1 := bullets[1].Geo.X
	y1 := bullets[1].Geo.Y

	gameloop.Game_updateBulletPositions(game, 0)

	if bullets[0].Geo.X != x0 || bullets[0].Geo.Y != y0 ||
		bullets[1].Geo.X != x1 || bullets[1].Geo.Y != y1 {

		t.Error("Expected no bullet positioning updates")
	}

	gameloop.Game_updateBulletPositions(game, 10_000) // <--- THAT IS FUCKING MICRO SECONDS

	if bullets[0].Geo.X != x0+10*bullets[0].Vel[0] || bullets[0].Geo.Y != y0 ||
		bullets[1].Geo.X != x1+10*bullets[1].Vel[0] || bullets[1].Geo.Y != y1 {

		t.Error("Expected bullets to be updated, but they were either updated wrong or not updated.")
	}
}

func TestBulletCollision(t *testing.T) {

	// TODO: This doesn't feel right... utils... test..?
	game, sockets, _ := NewGameComponents()

	gameloop.Game_startGame(game)

	fire := server.CreateMessage(server.Fire)
	sockets[0].inBound <- fire
	sockets[1].inBound <- fire

	// TODO: I AM THE BEST PROGRAMMER EVER BECAUSE I USE SLEEP IN TESTS
	time.Sleep(time.Millisecond)

	gameloop.Game_updateStateFromMessageQueue(game)

	if len(gameloop.GetGameBullets(game)) != 2 {
		t.Errorf("Expected to have 2 bullet but got %v", len(gameloop.GetGameBullets(game)))
	}

	gameloop.Game_updateBulletPositions(game, 2425_000) // <--- THAT IS FUCKING MICRO SECONDS
	gameloop.Game_checkBulletCollisions(game)

	if len(gameloop.GetGameBullets(game)) != 0 {
		t.Errorf("Expected to have 0 bullet but got %v", len(gameloop.GetGameBullets(game)))
	}
}

func TestBulletAndPlayerCollision(t *testing.T) {

	// TODO: This doesn't feel right... utils... test..?
	game, sockets, _ := NewGameComponents()

	gameloop.Game_startGame(game)

	fire := server.CreateMessage(server.Fire)
	sockets[0].inBound <- fire

    shooting_player := game.Players[0]

	// TODO: I AM THE BEST PROGRAMMER EVER BECAUSE I USE SLEEP IN TESTS
	time.Sleep(time.Millisecond)

	gameloop.Game_updateStateFromMessageQueue(game)

	bullets := gameloop.GetGameBullets(game)
	player := gameloop.Game_checkForBulletPlayerCollisions(game)

	if player != nil {
		t.Errorf("Did not expect the player to be colliding with a bullet: Player: %+v Bullets: %+v", player, bullets)
	}

	gameloop.Game_updateBulletPositions(game, 4925_000)

	player = gameloop.Game_checkForBulletPlayerCollisions(game)

	if player == nil {
		t.Errorf("Expected to have a collision, but results were nil: %+v %+v %+v",
			game.Players[0], game.Players[1], bullets[0])
	}

    if player == shooting_player {
		t.Errorf("Expected the player that shot not to be the one that was hit. %+v %+v %+v",
			game.Players[0], game.Players[1], bullets[0])
    }
}
