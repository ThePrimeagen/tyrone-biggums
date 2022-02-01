### Tags
[Go vs Typescript](https://www.youtube.com/watch?v=h7UEwBaGoVo): Video 1 of the series is tag go-vs-ts-video-1

### Current Project
Video 2 is going to be likely Go vs Rust vs Typescript, but I want it to be
more complex.  I want a server that has to perform a ton of operations and have
real deadlines.

#### Test Client (not started)
A test client should do the following.
1. request an Id
1. connect to the ws server
1. wait for play command
1. send fire commands every X amount of milliseconds
1. Whether client wins or loses, the client should check their stats after each
   round.

The cycle should repeat starting from point 2 over and over again.

#### Server
##### Getting stats
A simple post request for stats with a stat id should return the stats of a
given id retrieved from a database.

##### Server Stats
A post request for server stats should emit the following (these stats are
based off the last server stat request)

* active connections
* active games
* stat requests processed
* stats stored
* games played
* shots taken
* total ticks processed
* count of ticks exceeding 17ms, 19ms, 21ms, 26ms, 36ms, 50ms, 100ms
  * this will include processing time + sleep time.
  * an Ideally working server will approximately 60 tick server
* linode stats?  Unsure, working with linode on what is available.

##### Playing the game
The server, when a new web socket connection is established will either start a
wait period for the next connection or start a game.  The two connections will
remain open until one player is defeated.  At that point the connection should
be closed.

##### Game Loop
A game loop will be instantiated with two sockets.  The game loop will send out
a ready and play signal.

*Every tick (approx 16 ms) the game loop will execute the following in the
  following order:*

1. report stats
1. get a batch of updates to process (msgs from sockets)
1. process said updates
1. update every location of items
1. check for collisions
1. check for state of game
1. determine elapsed time and sleep for enough ms to maintain 60fps

this loop will repeat until one player has 0 health

### FAQ
#### What languages
Rust, Go, and Typescript.
* 69% chance i'll stop trying to make Rust work.  Its effing hard.

#### Idiomatic vs Similar behavior
This is a tough trade off.  I want to be able to build the servers in such a
way that each one is as "idiomatic" as possible but the following I will
concede the attempt.
1. In places where I don't even know what is idiomatic
1. Where doing the idiomatic thing would actually be bad for performance
1. Where doing the idiomatic thing would make the other servers very different
   in implementation.  Thus hard to say its an "apples to apples" comparison.

#### RxJS?
I do want to make the TS server implemented with and without rxjs.  It will
likely be pretty hard to do this, but  I believe I can :)

#### Metrics for success?
The primary metric for success will be `connections * 1 / (count of bad ticks /
total ticks)`.  This should give a relatively interesting score.

#### Any Secondary Metrics
If I can get linode metrics out via some end point, then I'll also figure out a
nice CPU and Memory metric over time.

#### Expectations?
I expect that Rust will be faster and more memory efficient, but I worry that I
am unable to create something that is this.  I will likely over clone and over
heap use because I am terrible at the language.  So this may hinder it.

Second I expect Go to be the easiest to implement, even though of the three
languages I am the least experienced in go by a very significant amount.

Lastly, I think implementing typescript with two different methods (rxjs vs not
rxjs) will be a pain in the ass and make me want to quit.
