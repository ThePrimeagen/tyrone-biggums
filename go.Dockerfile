FROM golang:latest
WORKDIR /app
COPY go .
RUN GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -a -ldflags '-extldflags "-static"' cmd/main.go
CMD ["sh", "-c", "./main"]


