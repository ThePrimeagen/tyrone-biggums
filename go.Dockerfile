FROM golang:latest
WORKDIR /app
COPY go .
RUN GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o server -a -ldflags '-extldflags "-static"' cmd/server/main.go
CMD ["sh", "-c", "./server"]


