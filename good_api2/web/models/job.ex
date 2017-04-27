defmodule GoodApi2.Job do
    use GoodApi2.Web, :model
    alias GoodApi2.CouchDb, as: Couch
    alias GoodApi2.Util
    alias GoodApi2.Tag, as: Tag
    alias GoodApi2.JobServer, as: JobServer
    alias GoodApi2.EventServer, as: Events
    alias GoodApi2.Util

    defstruct [:name, :company, :likes, :active_chats, :description, 
        :post_date, :salary_range, :employment_type, 
        :location, :tags]

    def new(inputs) do
        keys = ["name", "company", "description", "salary_range", "employment_type", "location", "tags"]
        case Util.check_keys(keys, inputs) do
            {:ok, job} ->
                add = %__MODULE__{
                    name: job["name"],
                    company: job["company"],
                    likes: [],
                    active_chats: [],
                    description: job["description"],
                    post_date: DateTime.to_string(DateTime.utc_now()),
                    salary_range: job["salary_range"],
                    employment_type: job["employment_type"],
                    location: job["location"],
                    tags: job["tags"]
                }

                case Couch.new_job(add) do
                    {:ok, _, _} -> 
                        add_job_to_company(job["company"], job["name"])
                        Tag.add(job["tags"])
                        Events.add_job(job["name"])
                        JobServer.add("#{job["company"]}&#{job["name"]}", job["company"], job["name"], job["description"], job["tags"]) 
                        {:ok, add}
                    {:error, _, _} -> {:error, "cannot fit inside"}
                    {:error, msg}  -> {:error, msg} 
                end 
            {:error, _msg} -> {:error, "all required fields not present"}
        end
    end

    def edit(inputs) do
        keys = ["name", "company", "description", "salary_range", "employment_type", "location", "tags"]
        with {:ok, edits} <- Util.check_keys(keys, inputs),
             {:ok, job} <- Couch.get_document(Couch.create_job_id(edits["company"], edits["name"]), "could not find job") do
                 Tag.add(job["tags"])
                 Couch.update_document_map(job, edits, "job edits applied")
        else 
            {:error, msg} -> {:error, msg} 
        end    
    end

    def show(company, job) do
        case Couch.valid_document?("#{company}&#{job}", "job not found") do
            {:found, job} -> {:ok, Poison.decode!(job)}
            {:error, msg} -> {:error, msg}
        end
    end

    def show(job) do
        case Couch.valid_document?(job, "job not found") do
            {:found, job} -> {:ok, Poison.decode!(job)}
            {:error, msg} -> {:error, msg}
        end
    end

    defp add_job_to_company(company, job) do
        Couch.company_new_job(company, job)
    end

    def like(job, user, choice) do
        case choice do
            "like" -> Couch.like(job, user, choice)
            "pass" -> Couch.like(job, user, choice)
            _      -> {:error, "invalid choice"}
        end
    end

    def approve(job, user, choice) do
        case choice do
            "approve" -> Couch.approve(job, user, choice)
            "reject"  -> Couch.approve(job, user, choice)
            _         -> {:error, "invalid choice"}
        end
    end
        
    def job_feed(seen) do
        JobServer.get()
        |>Enum.take(50)
        |>Enum.map(fn
            (map) ->
                [id] = Map.keys(map)
                data = map[id]
                       |>List.to_tuple()
                {name, company, des, tags} = data
                %{id: id, name: name, company: company, description: des, tags: tags} end)
        |>Enum.filter(fn(%{id: job}) -> 
            Enum.all?(seen, fn(seen_job) -> job != seen_job end) 
        end)
    end

    def delete(email, job_name_, company_name) do
        job_name = Couch.create_job_id(company_name, job_name_)
        #valid head_hr?
        #valid job?
        #get chats
        #get all users
        #remove chats from users
        #remove job from company
        #remove job from JobServer
        with {:ok, hr_head} <- Couch.get_document(email, "user not found"),
             {:ok, job} <- Couch.get_document(job_name, "job not found"),
             {:ok, company} <- Couch.get_document(hr_head["company"], "job not found"),
             :ok <- is_hr_head?(hr_head, company) do
                 all_users = job["active_chats"]
                 
                 #removing job from company
                 {:ok, new_job_list} = Couch.test_and_remove(company["jobs"], job["name"], "remove me!")
                 Couch.update_document(company, "jobs", new_job_list, "failed to remove job")

                 #removing active_chats from users
                 Enum.each(all_users, fn(a_user) -> 
                     {:ok, some_user} = Couch.get_document(a_user, "failed to find user")
                     {:ok, new_chat_ids} = Couch.test_and_remove(some_user["chat_ids"], job_name, "remove me!")
                     Couch.update_document(some_user, "chat_ids", new_chat_ids, "failed to remove job from user")
                 end)
                 
                 #removing chats
                 _chats_to_delete = all_users |>Enum.map(fn(user) -> Couch.delete_document("#{user}&&#{job_name}", "failed to delete chat document") end)

                
                 #removing job from job server and doc
                 Couch.delete_document(job_name, "failed to delete job document")
                 JobServer.delete(job_name)
                 {:ok, "done"} 
        else
            {:error, msg} -> {:error, msg}
        end 
    end

    defp is_hr_head?(user, company) do
            with true <- Util.equals(true, user["is_head?"]),
                 true <- Util.equals(user["company"], company["name"]) do
                :ok
            else
                {:error, _msg} -> {:error, "hr person cannot approve that user"}
                _ -> {:error, "hr person cannot approve that user"}
            end
    end
end
"""
curl -X POST -H "Content-Type: application/json" -d '
{"new": 
{"company":"Evil Corp",
"name": "paper boy",
"description": "deleiver papers to poeple",
"salary_range": "12 dollars an hour",
"employment_type": "full-time",
"location": "west long branch",
"tags":["paper", "boy", "newspapers"]}
}
' "http://localhost:4000/api/job"

curl -X POST -H "Content-Type: application/json" -d '
{"edit": 
{"company":"Evil Corp",
"name": "paper boy",
"description": "get papers to people",
"salary_range": "14 dollars an hour",
"employment_type": "full-time",
"location": "west long branch",
"tags":["paper", "boy", "newspapers"]}
}
' "http://localhost:4000/api/job/edit"

curl -X POST -H "Content-Type: application/json" -d '
{"company":"Evil Corp", "job":"paper boy"}
' "http://localhost:4000/api/job/show"

curl -X POST -H "Content-Type: application/json" -d '
{"job":"Evil Corp&paper boy"}
' "http://localhost:4000/api/job/view"

curl -X POST -H "Content-Type: application/json" -d '
{"job":"Evil Corp&wert4", "user":"jeff@gmail.com", "choice":"like"}
' "http://localhost:4000/api/job/like"

curl -X POST -H "Content-Type: application/json" -d '
{"job":"Evil Corp&paper boy", "user":"se.phildimarco@gmail.com", "choice":"approve"}
' "http://localhost:4000/api/job/approve"

curl -X POST -H "Content-Type: application/json" -d '
{"email":"se.phildimarco@gmail.com"}
' "http://localhost:4000/api/job/job_feed"

    returns a list [{id: company&job, name: job, company: company, description: des, tags: tags} ..]
    with the last 50 jobs created

curl -X POST -H "Content-Type: application/json" -d '
{"company": "Evil Corp", "job":"aa", "user":"hr_dimarco@gmail.com"}
' "http://localhost:4000/api/job/delete"

"""