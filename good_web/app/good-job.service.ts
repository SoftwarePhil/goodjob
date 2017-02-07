import { HrPerson } from './hr-person';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Injectable }     from '@angular/core';

import {Observable} from 'rxjs/Rx';

// Import RxJs required methods
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

@Injectable()
export class GoodJobService{
constructor (private http: Http) {}
public static hr_person: HrPerson
  
login(password: string, email: string)  {
 
  let creds = JSON.stringify({ email: email, password: password });

  let headers = new Headers();
  headers.append('Content-Type', 'application/json');

  this.http.post('http://localhost:4000/api/hr_person/authenticate', creds, {
    headers: headers
    }).map(data => data.json()).subscribe(
      data => 
        GoodJobService.hr_person = {
            email: data.email,
            name: data.name, 
            picture: data.picture,
            bio: data.bio,
            permissions: data.permissions, 
            role: data.role, 
            api_token: data.api_token
        }
      
    )
    }

  create_user(newPerson: any) :HrPerson {
    let creds = JSON.stringify(newPerson);

    let headers = new Headers();
    headers.append('Content-Type', 'application/json');

    this.http.post('http://localhost:4000/api/hr_person', creds, {
      headers: headers
      }).map(data => data.json()).subscribe(
        data => 
          GoodJobService.hr_person = {
              email: data.email,
              name: data.name, 
              picture: data.picture,
              bio: data.bio,
              permissions: data.permissions, 
              role: data.role, 
              api_token: data.api_token
          }
        
      )
      if(GoodJobService.hr_person == null){return {email: "", picture: "", bio: "",  permissions: [], role: "", api_token:"", name: "error!"}}
      return GoodJobService.hr_person;
    }

    get_user() :HrPerson {
     if(GoodJobService.hr_person == null){return {email: "", picture: "", bio: "",  permissions: [], role: "", api_token:"", name: "error!"}}
     return GoodJobService.hr_person;
    }

}
