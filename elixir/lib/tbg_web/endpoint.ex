defmodule TBGWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :tbg

  socket "/socket", TBGWeb.GameSocket,
    websocket: true,
    longpoll: false
end
