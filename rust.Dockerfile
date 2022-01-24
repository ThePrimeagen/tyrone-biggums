# syntax=docker/dockerfile:1
FROM rust:latest AS FETCH_THE_EFFIN_RUST
WORKDIR /app
COPY rust/Cargo.toml ./Cargo.toml
COPY rust/Cargo.lock ./Cargo.lock
COPY rust/src/lib.rs ./src/lib.rs
RUN rustup default nightly
RUN cargo fetch
COPY rust/src ./src
RUN cargo build --release --bin server
RUN cargo install --path .

FROM debian:latest
EXPOSE 42069
WORKDIR /app
RUN apt update && apt install -y ca-certificates
COPY --from=FETCH_THE_EFFIN_RUST /usr/local/cargo/bin/server /app
CMD ["sh", "-c", "/app/server"]

