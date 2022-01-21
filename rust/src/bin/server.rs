use std::{sync::{Arc, Mutex}, collections::HashMap};

use futures_channel::mpsc::unbounded;
use rust::{server::{server::{handle_connection, Server}, socket::Socket, message::{Emitter, Message}}, chat::Chat};
use tokio::{net::TcpListener, sync::mpsc::unbounded_channel};

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {

    let mut server = Server::new().await?;
    let mut chat = Chat::new(&mut server);

    server.join_handle.await?;


    return Ok(());
}

