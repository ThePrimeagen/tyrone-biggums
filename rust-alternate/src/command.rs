use anyhow::Result;
use clap::{Parser, Subcommand};

use crate::server::Server;

#[derive(Debug, Parser)]
#[clap(author, version, about, long_about = None)]
pub struct Cli {
    #[clap(subcommand)]
    pub command: Command,
}

impl Cli {
    pub async fn run(self) -> Result<()> {
        self.command.run().await
    }
}

#[derive(Debug, Subcommand)]
pub enum Command {
    /// Start bullet game server
    Start {
        /// The port to listen on
        #[clap(short, long, default_value = "42069")]
        port: u16,
    },
}

impl Command {
    pub async fn run(self) -> Result<()> {
        match self {
            Command::Start { port } => Server::new(port).run().await,
        }
    }
}
