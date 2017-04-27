defmodule GoodApi2.NotificationChannel do
    use Phoenix.Channel
    alias GoodApi2.EventServer, as: Event

    intercept(["new_notification"])

    def join("notifications:"<> _room_code, _message, socket) do
        Event.active_plus
        {:ok, socket}
    end

#GoodApi2.Endpoint.broadcast("notifications:hr_dimarco@gmail.com", "new_notification", %{msg: "new message"})
    def handle_out("new_notification", payload, socket) do
        push socket, "update", payload
        {:noreply, socket}
    end

    def terminate(_, socket) do
        Event.active_minus
        {:shutdown, :left}
    end

    def send_notification(user, message) when is_map(message) do
        GoodApi2.Endpoint.broadcast("notifications:"<>user, "new_notification", message)
    end

    def send_notification(user, message) do
        GoodApi2.Endpoint.broadcast("notifications:"<>user, "new_notification", %{message: message})
    end

    
end