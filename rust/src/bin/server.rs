#![feature(vec_retain_mut)]

use rust::{
    server::{server::Server},
};

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    env_logger::init();

    let mut server = Server::new().await?;
    let receiver = server.get_receiver();

    tokio::spawn(async move {
        let mut receiver = receiver.unwrap();
        while let Some(two_sockets) = receiver.recv().await {
            println!("{}", two_sockets.0);
            println!("{}", two_sockets.1);
        }
    });

    server.join_handle.await?;

    return Ok(());
}
