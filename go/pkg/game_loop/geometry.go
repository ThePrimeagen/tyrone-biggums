package gameloop

import "math"

type AABB struct {
	X      float64
	Y      float64
	Width  float64
	Height float64
}

func (a *AABB) HasCollision(b *AABB) bool {

	if a.X > b.X+b.Width || b.X > a.X+a.Width {
		return false
	}

	if a.Y > b.Y+b.Height || b.Y > a.Y+a.Height {
		return false
	}

	return true
}

func (a *AABB) HasCollisionFast(b *AABB, width float64) bool {
	return math.Abs(a.X-b.X) < width
}

func (a *AABB) SetPosition(x, y float64) {
	a.X = x
	a.Y = y
}
