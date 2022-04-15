use anyhow::Result;
use bullet_game::Cli;
use clap::StructOpt;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();
    Cli::parse().run().await
}
