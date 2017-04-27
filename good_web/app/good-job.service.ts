import {HrPerson, Company, Job, Message, Chat, JobSeekerProfile, CompanyView} from './data-class'
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Injectable }     from '@angular/core';
import { CookieService } from 'angular2-cookie/services/cookies.service'

import {Observable} from 'rxjs/Rx';

// Import RxJs required methods
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class GoodJobService{
  constructor (private http: Http, private cookie: CookieService) {}
  public static hr_person: HrPerson
  public static company: Company

  public base_url: string = "ec2-34-200-21-214.compute-1.amazonaws.com:4000/"
  //public base_url: string = "localhost:4000/"
  
  url: string = "http://"+this.base_url

  //base64 encoded
  public static default_picture: string = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAgMAAACJFjxpAAAADFBMVEXFxcX////p6enW1tbAmiBwAAAFiElEQVR4AezAgQAAAACAoP2pF6kAAAAAAAAAAAAAAIDbu2MkvY0jiuMWWQoUmI50BB+BgRTpCAz4G6C8CJDrC3AEXGKPoMTlYA/gAJfwETawI8cuBs5Nk2KtvfiLW+gLfK9m+r3X82G653+JP/zjF8afP1S//y+An4/i51//AsB4aH+/QPD6EQAY/zwZwN8BAP50bh786KP4+VT+3fs4/noigEc+jnHeJrzxX+NWMDDh4g8+EXcnLcC9T8U5S/CdT8bcUeBEIrwBOiI8ki7Ba5+NrePgWUy89/nYyxQ8Iw3f+pWY4h1gb3eAW7sDTPEOsLc7wK1TIeDuDB+I/OA1QOUHv/dFsZQkhKkh4QlEfOULYz2nGj2/Nn1LmwR/86VxlCoAW6kCsHRGANx1RgCMo5Qh2EsZgrXNQZZShp5Liv7Il8eIc5C91EHY2hxk6bwYmNscZIReDBwtCdhbErC1JGBpScBcOgFMLQsZMQs5Whayd+UQsLYsZGlZyNyykKllISNmIUfAwifw8NXvTojAjGFrdYi11SGWVoeYWx1i6lmQCiEjFkKOVgjZ+xxIhZCtFULWHkCqxCw9gNQKmP9vNHzipdEPrRcxtVbAeDkAvve0iM2QozVD9hfjhp4YP/UrkJYDbD2AtBxgfSkAvvHEeNcDSAsilgtAWxIy91J8AXgZAJ5e33+4tuACcAG4AFwALgBXRXQB6AFcB5MXAuA6nl9/0Vx/011/1V5/1/dfTPJvRtdnu/zL6beeFO/7r+fXBYbrEkt/j+i6ytXfpuvvE/ZXOnsA/a3a/l5xf7O6v1t+Xe/vOyz6HpO8yyboM8o7rfJes77bru83THk48p7TvOs27zvOO6/73vO++z7l4cgnMPQzKPopHC0N9noSSz6LJp/Gk88jyicy5TOp6qlc+VyyfDJbPpuuns6XzyfMJzTmMyrrKZ35nNJ8Ums+q7af1tvPK+4nNodEnPKp3fnc8npyez67/qVP7+/fL8hfcMjfsOhf8cjfMclfcnn9+BkOnLECP8Q58OYeyJ40eoyF6Ee/En/JHlP6mIlRVXprF4BxtAvArV0AxtEuALd2ARhHuwDc2gVgHPX/hFv9fMBddjIGeKg/WCxlCsI46u+Ga5mCcJd+sIG9UkGAW32ZbApFAHhod4Bb3eo04h3god0BbiUHYApVCNjbHeBW+QDAXT4a7qg7r7e214057vg0QhkEHkoSwq0kIdydXw4/Q3H8hjYJ3vL0WConBJhCHQaOToeBrU0BljYFmEoVgHGUKgAPnREAt84IgLuqFgAYSUEOAHszDwuAtSkHAZhLGYIpdCLgKGUIHtocZG1zkLmUIRhxDnJU1RDA1uYga5uDzKUOwhTnIEfnxcDe5iBrcyQAYGlzkKkUYhhxDrKXQgxbSwLWUohhbknA1JKAEZOAvSUBW0sC1pYEzC0JmFoSMMJyCDhaFrK3JGDtyiFgaVnI3LKQqWUhI2YhR8tC9paFrC0LWVoWMrcsZGpZyIhZyNGykL2rSIGtlQHWVgZYWhlgbmWAqZUBRiwDHK0MsLcywNbKAGsOoNUhllaHmFsdYmp1iBHrEEerQ+w5gFYI2VodYm11iKXVIeYcQCuETK0QMmIh5MgBtELI3gohWyuErDmAVolZWiFkzgG0SszUKjGjfj6gVmKOVonZcwCtFbB9HQC+ozWDbz1bvGu9iKW1AuYcQOtFTLEX1GbIaFegN0OOHEBrhuw5gNYM2XIArRuz5gDacoB3bTnAEktxXQ4wfw0AvveM8b4tiJjSJOwLIsbXsAKeNeKCiOO3D+AVbUl0AfjGs8ZPbUnIdgFoa1LWC0BblfMuB9AeC1j6gqQE0J9LmC8AOYD2ZMb7i4bt2ZTpWoHfPoB7Tj2fXzT8N1X41vkq/QHOAAAAAElFTkSuQmCC"

  create_user(newPerson: any) :Observable<HrPerson> {
    let creds = JSON.stringify(newPerson);

    let headers = new Headers();
    headers.append('Content-Type', 'application/json');

    return this.http.post(this.url + 'api/hr_person', creds, {
      headers: headers
       }).map(data => this.mapHrPerson(data))

    }

    create_company(newPerson: any) :Company {
    let creds = JSON.stringify(newPerson);

    let headers = new Headers();
    headers.append('Content-Type', 'application/json');

    this.http.post(this.url + 'api/company', creds, {
      headers: headers
      }).map(data => data.json()).subscribe(
        data =>
          GoodJobService.company = {
              name: data.name,
              logo: data.logo,
              bio: data.bio,
              list_of_locations: data.list_of_locations,
              link_to_website: data.link_to_website,
              hr_manager_ids: data.manager_ids,
              jobs:[]
          }

      )
      if(GoodJobService.company == null){this.fetch_null_company()}
      return GoodJobService.company;
    }

    get_user() :HrPerson {
     let user = this.cookie.get("user")
     console.log(user)
     if(user === undefined){return this.fetch_null_hr_person()}

     let d_user: HrPerson = <HrPerson>JSON.parse(user);

    if(d_user.picture == "default"){
       d_user.picture = GoodJobService.default_picture
    }

     return d_user;
    }

    get_temp_user() :HrPerson {
     if(GoodJobService.hr_person === undefined){return this.fetch_null_hr_person()}
     return GoodJobService.hr_person
    }

    fetch_null_hr_person() :HrPerson {
     return {email: "", picture: "", bio: "",  permissions: [], role: undefined, name: "Please Login", company: "", head: false}
    }

    login(password: string, email: string): Observable<HrPerson>{
      let creds = JSON.stringify({ email: email, password: password });

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      return this.http.post(this.url + 'api/hr_person/login', creds, {
        headers: headers
        }).map(this.mapHrPerson)
    }

    setUserCookie(){
      let hr_person_cookie: HrPerson = GoodJobService.hr_person;
      if(hr_person_cookie.picture != "default"){hr_person_cookie.picture = "not-default"}
      this.cookie.putObject("user", hr_person_cookie)
      console.log("set cookie to " +  hr_person_cookie)
    }

    logout(){
      this.cookie.removeAll()
    }

    upload_picture(email: string, picture: string): Observable<HrPerson>{
      let body = JSON.stringify({ email: email, picture: picture });

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      return this.http.post(this.url + 'api/hr_person/update_picture', body, {
        headers: headers
        }).map(this.mapHrPerson)
    }

     upload_logo(email: string, company: string, picture: string): Observable<any>{
      let body = JSON.stringify({ email: email, company: company, picture: picture });
      console.log(body)
      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      return this.http.post(this.url + 'api/company/update_picture', body, {
        headers: headers
        }).map(this.map_message)
    }

    mapHrPerson(response:Response): HrPerson{
     // console.log("res::", response.json())
      let data = response.json();
      let user = <HrPerson>({
            email: data.email,
            name: data.name,
            picture: data.picture,
            bio: data.bio,
            permissions: data.permissions,
            role: data.role,
            company: data.company,
            head: data.head
        })
       // console.log("parsed company!", user)
        GoodJobService.hr_person = user
      return user
    }

    fetch_null_company(): Company  {
      return {name: "error", logo: "", bio: "", link_to_website: "", list_of_locations: [], hr_manager_ids: [], jobs:["no jobs"]}
    }

    fetch_company(name: string): Observable<Company>{
      let body = JSON.stringify({ name: name});

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      return this.http.post(this.url + 'api/company/show', body, {
        headers: headers})
        .map(this.mapCompany);
    }

    fetch_company_view(name: string): Observable<CompanyView>{
      let body = JSON.stringify({ name: name});

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      return this.http.post(this.url + 'api/company/view', body, {
        headers: headers})
        .map(this.mapCompany);
    }

    fetch_company_logo(name: string): Observable<any>{
      let body = JSON.stringify({ company: name});

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      return this.http.post(this.url + 'api/company/logo', body, {
        headers: headers})
        .map(this.map_message);
    }

  mapCompany(response:Response): Company{
     // console.log("res::", response.json())
      let data = response.json();
      let company = <Company>({
                name: data.name,
                logo: data.logo,
                bio: data.bio,
                list_of_locations: data.list_of_locations,
                link_to_website: data.link_to_website,
                hr_manager_ids: data.manager_ids,
                jobs: data.jobs
        })
        //console.log("parsed company!", company)

      return company
    }

    mapCompanyView(response:Response): CompanyView{
     // console.log("res::", response.json())
      let data = response.json();
      let company = <CompanyView>({
                name: data.name,
                logo: data.logo,
                bio: data.bio,
                list_of_locations: data.list_of_locations,
                link_to_website: data.link_to_website,
        })
        //console.log("parsed company!", company)

      return company
    }

    add_user_to_company(company: string, user: string){
        let body = JSON.stringify({company: company, email: user});
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');

        return this.http.post(this.url + 'api/company/add_user', body, {
          headers: headers
          }).map(this.map_message);
    }

    approve_user_to_company(sender: string, company: string, user: string, choice: string){
        let body = JSON.stringify({sender: sender, company: company, email: user, choice: choice});
        let headers = new Headers();
        headers.append('Content-Type', 'application/json');

        return this.http.post(this.url + 'api/company/approve_user', body, {
          headers: headers
          }).map(this.map_message);
    }

    fetch_null_job() :Job {
       return { name: "no job found",
                company: "",
                likes: [],
                active_chats: [],
                description: "",
                post_date: "",
                salary_range: "",
                employment_type: "",
                location: "",
                tags: []
              }
    }

    new_job(job: any) :Observable<Job>{
      let creds = JSON.stringify(job);

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      return this.http.post(this.url + 'api/job', creds, {
        headers: headers
        }).map(this.mapJob);
      }


    edit_job(job: any) :Observable<Job>{
      let creds = JSON.stringify(job);

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      return this.http.post(this.url + 'api/job/edit', creds, {
        headers: headers
        }).map(this.mapJob);
      }

    delete_job(name: string, user: string, company: string) :Observable<Job>{
      let creds = JSON.stringify({job: name, user: user, company: company});

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      return this.http.post(this.url + 'api/job/delete', creds, {
        headers: headers
        }).map(this.map_message);
    }

    fetch_job(company: string, name: string) :Observable<Job>{
      let creds = JSON.stringify({job: name, company: company});

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      return this.http.post(this.url + 'api/job/show', creds, {
        headers: headers
        }).map(this.mapJob);
    }


    mapJob(response:Response): Job{
     // console.log("res::", response.json())
      let data = response.json();
      let company = <Job>({
                name: data.name,
                company: data.company,
                likes: data.likes,
                active_chats: data.active_chats,
                description: data.description,
                post_date: data.post_date,
                salary_range: data.salary_range,
                employment_type: data.employment_type,
                location: data.location,
                tags: data.tags
        })
        //console.log("job company!", company)

      return company
    }

    fetch_null_chat(): Chat{
      return{
        job_seeker: "empty chat",
        job:"",
        messages: this.fetch_null_message()
      }
    }

    fetch_null_message(): Message[]{
      return [{sender: "GoodJob", sender_name:"", timestamp:"", content:"no messages"}]
    }

    fetch_chat(job_seeker_name: string, company_name: string, job_name: string) :Observable<Chat>{
      let creds = JSON.stringify({job_seeker: job_seeker_name, job: this.make_job_id(company_name, job_name)});

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      return this.http.post(this.url + 'api/chat/show', creds, {
        headers: headers
        }).map(this.map_chat);
    }

    send_message(sender: string, job_seeker_name: string, company_name: string, job_name: string, msg: string) :Observable<Chat>{
      let creds = JSON.stringify({sender: sender, job_seeker: job_seeker_name, job: this.make_job_id(company_name, job_name), content: msg});

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      return this.http.post(this.url + 'api/chat', creds, {
        headers: headers
        }).map(this.map_chat);
    }

    create_new_message(sender: string, sender_name: string, msg: string): any{
      return {sender: sender, sender_name: sender_name, content: msg};
    }

    map_chat(response:Response): Chat{
      //console.log("res::", response.json())
      let data = response.json();
      let chat = <Chat>({
               job_seeker: data.job_seeker,
               job: data.job,
               messages: data.messages
        })

      return chat
    }

    approve_user(job: string, company: string ,user: string, choice: boolean):Observable<any>{
      let headers = new Headers();
      headers.append('Content-Type', 'application/json');
      let job_id = this.make_job_id(company, job)

      if(choice){
        let body = JSON.stringify({job: job_id, user: user, choice: "approve"});

        return this.http.post(this.url + 'api/job/approve', body, {
          headers: headers
          }).map(this.map_message);
        }
      else{
        let body = JSON.stringify({job: job_id, user: user, choice: "reject"});

        return this.http.post(this.url + 'api/job/approve', body, {
          headers: headers
          }).map(this.map_message);
        }
      }

     map_message(response:Response): any{
      return response.json();
    }

    private make_job_id(company: string, job: string): string {
      return company + '&' + job
    }

  fetch_null_job_seeker_profile(): JobSeekerProfile{
    return{
      name: "user not found",
      picture: "",
      bio: "",
      resume: "",
      tags: []
    }
  }

  fetch_job_seeker_profile(email: string) :Observable<JobSeekerProfile>{
      let creds = JSON.stringify({email: email});

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      return this.http.post(this.url + 'api/job_seeker/profile', creds, {
        headers: headers
        }).map(this.mapJobSeekerProfile);
    }

  mapJobSeekerProfile(response:Response): JobSeekerProfile{
      let data = response.json();
      let job_seeker = <JobSeekerProfile>({
                name: data.name,
                picture: data.picture,
                bio: data.bio,
                resume: data.resume,
                tags: data.tags
        })
      return job_seeker
    }


  upload_resume(email: string, password: string, resume: string): Observable<any>{
      let body = JSON.stringify({ email: email, password: password ,resume: resume });

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      return this.http.post(this.url + 'api/job_seeker/profile/add_resume', body, {
        headers: headers
        }).map(this.map_message)
    }

    show_resume(email: string){
      let body = JSON.stringify({ email: email });

      let headers = new Headers();
      headers.append('Content-Type', 'application/json');

      return this.http.post(this.url + 'api/job_seeker/profile/view_resume', body, {
        headers: headers
        }).map(this.map_message)
    }
}
