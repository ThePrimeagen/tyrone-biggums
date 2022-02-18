use crate::{error::BoomerError, server::socket::Socket};

pub mod game_setup;

pub async fn play_the_game((s1, s2): (Socket, Socket)) -> Result<(), BoomerError> {

    let (mut s1, mut s2) = game_setup::wait_for_ready(s1, s2).await?;

    let res1 = s1.close().await;
    let res2 = s2.close().await;

    res1?;
    res2?;

    return Ok(());
}

