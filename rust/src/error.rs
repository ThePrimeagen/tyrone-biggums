use thiserror::Error;
use tokio::task::JoinError;

#[derive(Error, Debug)]
pub enum BoomerError {
    #[error("Both players were unable to ready up within 30 seconds")]
    TimeoutOnReady,

    #[error("Unable to serialize or deserialize json")]
    SerdeJsonError(#[from] serde_json::Error),

    #[error("take_receiver called but its None.")]
    ReceiverTaken,

    #[error("tokio gives me some great errors!  This is from a join_handle.await")]
    JoinHandleError(#[from] JoinError),

    #[error("Tungenstenite error")]
    Tungstenite(#[from] tokio_tungstenite::tungstenite::Error),

    #[error("Playing simulation failed at reading readyup")]
    PlayerReadyUpError,

    #[error("Playing simulation didn't get a fire command.")]
    PlayerFireCommand,

    #[error("Playing simulation didn't get a game over command.")]
    PlayerGameOver,
}


