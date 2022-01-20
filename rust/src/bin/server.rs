use std::{sync::{Arc, Mutex}, collections::HashMap};

use futures_channel::mpsc::unbounded;
use rust::server::{server::{handle_connection, Server}, socket::Socket, message::{Emitter, Message}};
use tokio::{net::TcpListener, sync::mpsc::unbounded_channel};

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {

    let mut server = Server::new().await?;
    let (tx, mut rx) = unbounded_channel::<Message>();
    server.listen(tx);

    tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            println!("main function just got the message {:?}", msg);
        }
    });
    server.join_handle.await?;


    return Ok(());
}

