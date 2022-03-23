defmodule TBG.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # Start the Telemetry supervisor
      TBGWeb.Telemetry,
      # Start the PubSub system
      {Phoenix.PubSub, name: TBG.PubSub},
      # Start the Endpoint (http/https)
      TBGWeb.Endpoint,
      # Start a worker by calling: TBG.Worker.start_link(arg)
      # {TBG.Worker, arg}
      {DynamicSupervisor, strategy: :one_for_one, name: TBG.DynamicSupervisor}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: TBG.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    TBGWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
