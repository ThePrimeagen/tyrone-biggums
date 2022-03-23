defmodule TBG.Game do
  @moduledoc """
  Game Server
  """
  use GenServer

  require Logger

  @tick_interval_ms 16

  @doc """
  Start a game.
  """
  @spec start_link(term()) :: GenServer.on_start()
  def start_link(user_id) do
    GenServer.start_link(__MODULE__, user_id, name: user_id)
  end

  @doc """
  Supervisor child specification for a game.
  """
  @spec child_spec(term()) :: Supervisor.child_spec()
  def child_spec(user_id) do
    %{
      id: :"#{inspect(user_id)}",
      start: {__MODULE__, :start_link, [user_id]}
    }
  end

  ## GenServer callbacks

  @impl GenServer
  def init(user_id) do
    state = %{
      user_id: user_id
      # what should we store between ticks?
    }

    schedule_tick()

    {:ok, state}
  end

  @impl GenServer
  def handle_info(:tick, state) do
    Logger.info("[#{state.user_id}] Game tick... log info?")
    do_tick(state)
  end

  ## Helpers

  defp do_tick(state) do
    #
    # Do game stuff...
    #
    new_state = state
    game_finished? = false

    if not game_finished? do
      # Game still going on. Schedule next tick and update game state.
      schedule_tick()
      {:noreply, new_state}
    else
      # Game is finished. Terminate the process normally.
      {:stop, :normal, new_state}
    end
  end

  defp schedule_tick do
    Process.send_after(self(), :tick, @tick_interval_ms)
  end
end
