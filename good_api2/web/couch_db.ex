defmodule GoodApi2.CouchDb do
    alias Couchdb.Connector.Writer
    alias Couchdb.Connector.Reader
    alias Couchdb.Connector
    alias GoodApi2.NotificationChannel
    
    #http://127.0.0.1:5984/_utils/index.html
    @goodjob_db %{protocol: "http", hostname: "localhost",database: "good_job", port: 5984}

    def init_db() do
        Couchdb.Connector.Storage.storage_up(@goodjob_db)
    end

    
    @doc"""
    updates a the couch db docuement.
    Takes the old document, the field name, the new field,
    and a success message

    returns {:ok, new_document}
    """
    def update_document(old, field_name, new_field_data, success) do
         case Connector.update(@goodjob_db, %{old | field_name => new_field_data}) do
             {:ok, %{:headers => _h, :payload => _p}} -> {:ok, %{old | field_name => new_field_data}}
             {:error, _} -> {:error, "failed to update document (error doing #{success})"}
         end
    end

    def update_document_map(old, map, success) do
         case Connector.update(@goodjob_db, new = Map.merge(old, map)) do
             {:ok, %{:headers => _h, :payload => _p}} -> {:ok, new}
             {:error, _} -> {:error, "failed to update document (error doing #{success})"}
         end
    end


    @doc"""
    returns a document if found (not decoded from JSON)

    returns {:ok, document}
    """    
    def valid_document?(key, error) do
        case Reader.get(@goodjob_db, key) do
            {:ok, data}      -> {:found, data}
            {:error, _error} -> {:error, error}
        end
    end


     @doc"""
    returns a document if found decoded from JSON

    returns {:ok, document}
    """  
    def get_document(key, error) do
        case Reader.get(@goodjob_db, key) do
            {:ok, data} -> {:ok, Poison.decode!(data)}
            {:error, _} -> {:error, error}  
        end
    end

    def delete_document(key, error) do
         case get_document(key, error) do
             {:ok, document} -> 
                 Couchdb.Connector.destroy(@goodjob_db, key, document["_rev"])
                 {:ok, "document deleted"}
            _ -> {:error, error}
         end
    end

    def write_document(key, body) do
        json = Poison.encode!(%{"body"=>body})
        case Writer.create(@goodjob_db, json, key) do
            {:ok, _, _} -> {:ok, "document added"}
            {:error, _, _} -> {:error, "cound not add document"}
        end
    end

    def new_user(user) do
        IO.inspect user
        json = Poison.encode!(user)
       
        case String.contains?(user.email, "@") do
            true  -> Writer.create(@goodjob_db, json, user.email)
            false -> {:error, "no @ sign", :bad}
        end
        
    end

    def validate(email, password) do
        case Reader.get(@goodjob_db, email) do
            {:ok, data} -> 
                user = Poison.decode!(data)
                pass = user["password"]
                case pass do
                    pass when pass == password -> {:ok, user}
                    _ -> {:error, "bad password"}
                end
            {:error, _} -> {:error, "no match"}    
        end
    end

    def profile(email) do
         case Reader.get(@goodjob_db, email) do
            {:ok, data} -> {:ok, Poison.decode!(data)}
            {:error, _} -> {:error, "no match"}    
        end
    end

    def user_update_company(email, company) do
        case Reader.get(@goodjob_db, email) do
            {:ok, data} -> 
                case get_company(company) do
                    {:ok, _} -> user = Poison.decode!(data)
                                {:ok, %{:headers => _h, :payload => _p}} = Connector.update(@goodjob_db, %{user | "company" => company, "is_head?" => true})
                    {:error, _} -> {:error, "company not found"}
                end
            {:error, _} -> {:error, "no match"}
        end
    end

    def new_company(company) do
        IO.inspect company
        json = Poison.encode!(company)
       
        case !String.contains?(company.name, "@") do
            true  -> Writer.create(@goodjob_db, json, company.name)
            false -> {:error, "has @ sign", :bad}
        end
        
    end

    def get_company(name) do
        case Reader.get(@goodjob_db, name) do
            {:ok, data} -> {:ok, Poison.decode!(data)}
            {:error, _} -> {:error, "company not found"}  
        end
    end

    def company_new_job(company, job) do
        case get_company(company) do
            {:ok, company} -> 
                    list = case company["jobs"] do
                                nil -> []
                                jobs -> jobs
                           end
                    {:ok, %{:headers => _h, :payload => _p}} = Connector.update(@goodjob_db, %{company | "jobs" => list ++ [job]})
            {:error, _} -> {:error, "company not found"}
        end
    end

    def create_job_id(company, name) do
        "#{company}&#{name}"
    end

    def new_job(job) do
        json = Poison.encode!(job)
        case !String.contains?(job.name, "&") do
            true  -> 
                case get_company(job.company) do
                    {:ok, _company} -> Writer.create(@goodjob_db, json, create_job_id(job.company, job.name))
                    {:error, _} -> {:error, "invalid company"}
                end
            false -> {:error, "has @ sign", :bad}
        end
    end

    #this can be moved to Job model
    def like(job_name, user_name, "pass") do
        with {:found, user_result}   <- valid_document?(user_name, "job seeker not found"),
             {:found, job_result}    <- valid_document?(job_name, "job not found"),
             {user, job}             <- decode_user_job(user_result, job_result),      
             nil                     <- Enum.find(job["likes"], fn(user)->user==user_name end),
             nil                     <- Enum.find(job["active_chats"], fn(user)->user==user_name end) do
                 user = Poison.decode!(user_result)
                 update_document(user, "seen", add_to_list(user["seen"], job_name), "job added to seen")
                 {:ok, "job passed"}
        else
            {:error, message}       -> {:error, message}
            str when is_binary(str) -> {:error, "job in liked active chat cannot pass"} #job was found in lkes/active chat
                                  _ -> {:error, "failed to pass"}       
        end
    end

    #this should be moved to Job model
    def like(job_name, user_name, "like") do
        with {:found, user_result}  <- valid_document?(user_name, "job seeker not found"),
             {:found, job_result}   <- valid_document?(job_name, "job not found"),
             {user, job}            <- decode_user_job(user_result, job_result),              
             nil                    <- Enum.find(job["likes"], fn(user)->user==user_name end),
             nil                    <- Enum.find(user["seen"], fn(job)->job==job_name end),
             nil                    <- Enum.find(job["active_chats"], fn(user)->user==user_name end) do 
                update_document(job, "likes", add_to_list(job["likes"], user_name), "user added to liked jobs")
                update_document(user, "seen", add_to_list(user["seen"], job_name), "job added to seen")
                IO.inspect([job["company"], %{message: "new like on #{job["name"]}", state: user_name, actor: job["name"]}])
                NotificationChannel.send_notification(job["company"], %{message: "new like on #{job["name"]}", state: user_name, actor: job["name"]})
                {:ok, "job liked"}
        else
            {:error, message}       -> {:error, message}
            str when is_binary(str) -> {:error, "job in liked/active/seen already"}
                                  _ -> {:error, "error failed to like job"}
        end
    end

    defp decode_user_job(raw_user, raw_job) do
        job = Poison.decode!(raw_job)
        user = Poison.decode!(raw_user)
        {user, job}
    end

    #makes a new chat with the company and user, returns the new chat id
    def approve(job_name, user_name, "approve") do
        with {:found, user_result} <- valid_document?(user_name, "job seeker not found"),
             {:found, job_result} <- valid_document?(job_name, "job not found"),
             {user, job} <- decode_user_job(user_result, job_result),
             {:ok, list} <- test_and_remove(job["likes"], user_name, "user not found in the job likes'"),
             {:ok, chat} <- new_chat(user, job_name) do
                 {:ok, %{:headers => _h, :payload => _p}} = Connector.update(@goodjob_db, %{job | "likes" => list, "active_chats"=>add_to_list(job["active_chats"], user_name)}) 
                 {:ok, chat}
             else 
                 {:error, msg} -> {:error, msg}
                  _            -> {:error, "failed to approve user"}
             end
    end

    def approve(job_name, user_name, "reject") do
        with {:found, _user_result} <- valid_document?(user_name, "job seeker not found"),
             {:found, job_result} <- valid_document?(job_name, "job not found"),
             job = Poison.decode!(job_result),
             {:ok, list} <- test_and_remove(job["likes"], user_name, "user not found in job") do
                 update_document(job, "likes", list, "rejected user")
                 {:ok, "user rejected"}
        else 
           {:error, msg} -> {:error, msg}
           _             -> {:error, "failed to reject user"}   
        end         
    end

    #takes a user and a job name and creates a new chat document and adds the chat to the user
    defp new_chat(job_seeker, job) do
        empty_chat = %{"job_seeker"=>job_seeker["email"], "job_seeker_name"=>job_seeker["name"], "job"=>job, "messages"=>[]}
        |>Poison.encode!

        new_id = make_chat_id(job_seeker["email"], job)
        #assume job/jobseeker validaded in approve
        case Writer.create(@goodjob_db, empty_chat, new_id) do
            {:ok, _, _} -> 
                {:ok, %{:headers => _h, :payload => _p}} = Connector.update(@goodjob_db, %{job_seeker | "chat_ids" => add_to_list(job_seeker["chat_ids"], job)})
                {:ok, new_id}
            {:error, _, _} -> {:error, "failed to create chat"}
        end
    end

    def make_chat_id(job_seeker, job) do
        "#{job_seeker}&&#{job}"
    end

##think about how to intergrate this with sockets .. bad duplucation of data
    def send_message(job_seeker, job, message) do
        chat_id = make_chat_id(job_seeker, job)
        case valid_document?(chat_id, "chat not found") do
            {:found, raw} ->
                case valid_document?(message["sender"], "user not found to send message") do
                    {:found, user_raw} ->
                        chat = Poison.decode!(raw)
                        user = Poison.decode!(user_raw)
                        message = %{message | "sender_name"=>user["name"]}
                        update_document(chat, "messages", add_to_list(chat["messages"], message), "message sent")
                    {:error, msg} -> {:error, msg}
                end
            {:error, msg} -> {:error, msg}
        end
    end

    def add_to_list(list, item) do
        case list do
            list when list == nil -> [item]
            _ ->
                list++[item]
                |>Enum.uniq()       
        end
    end

    def test_and_remove(list, item, msg) do
        size = Enum.count(list)
        new_list = List.delete(list, item)
        size2 = Enum.count(new_list)
    
        case size - size2 == 0 do
            true  -> {:error, msg}
            false -> {:ok, new_list}
        end
    end
end