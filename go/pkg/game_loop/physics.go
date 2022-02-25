package gameloop

type Vector2D = [2]float64;

type Updatable interface {
    Update(xDelta, yDelta float64)
    GetVelocity() *Vector2D
}

func UpdateItems[T Updatable](items []T, delta uint) {
    for _, item := range items {
        vel := item.GetVelocity()
        item.Update(vel[0] * float64(delta), vel[1] * float64(delta))
    }
}

