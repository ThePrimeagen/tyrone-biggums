use std::{time::Duration, sync::atomic::{AtomicBool, Ordering}};

use tokio::sync::mpsc::{Receiver, Sender, channel};

pub struct Kill {
    rx: Receiver<()>,
    tx: Sender<()>,
}

impl Kill {
    pub fn new() -> Kill {
        let (tx, rx) = channel(1);
        return Kill {
            rx,
            tx,
        };
    }

    pub async fn kill(&mut self) {
        match self.tx.send(()).await {
            _ => {}
        }
    }

    pub async fn wait_for_kill_signal(&mut self) {
        self.rx.recv().await;
    }
}

pub struct Timeout {
    pub timedout: AtomicBool,
    kill: Kill,
}

impl Timeout {
    pub fn new() -> Timeout {
        return Timeout {
            timedout: AtomicBool::new(false),
            kill: Kill::new(),
        }
    }

    pub async fn timeout(&mut self, timeout: Duration) -> bool {
        tokio::select! {
            _ = tokio::time::sleep(timeout) => {
                self.timedout.store(true, Ordering::Relaxed);
            },
            _ = self.kill.wait_for_kill_signal() => { }
        }

        return self.timedout.load(Ordering::Relaxed);
    }

    pub async fn finish(&mut self) {
        self.kill.kill().await;
    }
}

