use futures::StreamExt;

#[tokio::main]
async fn main() {
    let url = url::Url::parse("ws://0.0.0.0:42069").unwrap();

    println!("About to handshake this little connection");
    let (ws_stream, _) = tokio_tungstenite::connect_async(url).await.expect("Failed to connect");
    println!("WebSocket handshake has been successfully completed");

    let (_, mut read) = ws_stream.split();

    if let Some(Ok(item)) = read.next().await {
        if item.is_text() {
            println!("Text, but still, what the hell? {:?}", item);
        } else {
            println!("what the hell did i just get ?? {:?}", item);
        }
    } else {
        println!("I tried to read next and got something weird");
    }
}
