import { Component, NgModule, OnInit, Input} from '@angular/core';
import { Job } from './data-class';
import { GoodJobService } from './good-job.service';
import { CreateJob} from './create_job.component';
import { Routes } from '@angular/router';
import { MessageService } from "./message-service";
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from "rxjs";


@Component({
  selector: 'job-panel',
  templateUrl: 'app/template/job-panel.html'
})

export class JobPanel implements OnInit{
  @Input()
  name: string

  @Input()
  company: string

  strId: string
  strIdH: string
  static counter: number = 0

  job: Job
  
  edit: boolean = false
  choices: string[] = ["part-time", "full-time", "seasonal", "salary"]
  selectedValue: string;
  tag_display: string
  new_like: Subscription;

  constructor(private goodJobService: GoodJobService, private messageService: MessageService, public fb: FormBuilder) {
    this.job = goodJobService.fetch_null_job()
    JobPanel.counter++;
    let id = JobPanel.counter;
    this.strId = "collapse"+id;
    this.strIdH = "#collapse"+id;
    //need to add job name to message ..
    this.new_like = this.messageService.getJobLike().subscribe(message=>this.add_user_to_likes(message))
  }


  ngOnInit(){
   if(this.company != undefined && this.name != undefined){
    this.goodJobService.fetch_job(this.company, this.name).subscribe(p => this.setJobData(p))
   }
  }

  setJobData(job: Job){
    this.job = job;

    var index = this.choices.indexOf(this.job.employment_type);
    if (index > -1) {
      this.choices.splice(index, 1);
    }
    this.choices.unshift(this.job.employment_type)
    this.tag_display = this.write_tags_from_db(job.tags)
  }

  approve(user: string){
    let res: string

    this.goodJobService.approve_user(this.job.name, this.job.company, user, true)
    .subscribe(p => res = p, error=>this.job.name = "action failed")

    var i = this.job.likes.indexOf(user)
    if (i > -1) {
      this.job.likes.splice(i, 1)
      this.job.active_chats.push(user)
    }

    console.log(res)
  }

  reject(user: string){
    let res: string

    this.goodJobService.approve_user(this.job.name, this.job.company, user, false)
    .subscribe(p => res = p, error=>this.job.name = "action failed")

    var i = this.job.likes.indexOf(user)
    if (i > -1) {
      this.job.likes.splice(i, 1)
    }
  }
   
  profileClick(email: string){
    this.messageService.sendProfileClick(email)
  }

  chatClick(job_seeker: string, company: string, job: string){
    this.messageService.sendProfileClick(job_seeker)
    this.messageService.sendChatClick(job_seeker, company,job)
  }

  edit_job(){
    if(this.edit == true){
      this.edit = false;
    }
    else{
      this.edit = true;
    }
  } 

  public editJobForm = this.fb.group({
      name: ["", Validators.required],
      description: ["", Validators.required],
      salary_range: ["", Validators.required],
      location: ["", Validators.required],
      tags: ["", Validators.required]    
  });

    editJobEvent(event: any) {
      this.job.description = this.editJobForm.value.description
      this.job.salary_range = this.editJobForm.value.salary_range
      this.job.location = this.editJobForm.value.location
      this.job.tags = this.make_tag_list(this.editJobForm.value.tags)
      
       this.goodJobService.edit_job(this.makeEditJob(this.job))
       .subscribe(job => this.edit_job(), error=> this.job.name = "error creating job!")
    console.log(this.job)
  }

 makeEditJob(job: Job){
    return { 
            edit: {
              "company": job.company,
              "name": job.name, 
              "description": job.description,
              "salary_range": job.salary_range,
              "employment_type": job.employment_type,
              "location":job.location,
              "tags": this.job.tags
            }
           }
 }

 make_tag_list(str: string) :string[] {
    return str.split(", ")
  }

   seeVal(){
      var e: any = document.getElementById("editJobDropdown");
      var val = e.options[e.selectedIndex].value;
      this.job.employment_type = val
      console.log(val)
  }

  deleteJob(){
    this.goodJobService.delete_job(this.job.name, this.goodJobService.get_user().email, this.job.company)
    .subscribe(ok=>this.messageService.sendDeleteJob(this.job.name), error=>console.log("failed to delete job"))    
  }

  sendDeleteJob(job: string){
    this.messageService.sendDeleteJob(job)
  }

  write_tags(tags: string[]): string{
    let str: string = tags[0];
    
    for(var i = 1; i < tags.length; i++){
      str = str+", " + tags[i]
    }

    return str.slice(0, -2)
  }


  write_tags_from_db(tags: string[]): string{
    let str: string = tags[0];
    
    for(var i = 1; i < tags.length; i++){
      str = str+", " + tags[i]
    }

    return str
  }

  add_user_to_likes(message: any){
    let user = message.state
    let job_name = message.actor
    console.log(message)
    
    if(job_name == this.job.name){
      this.job.likes.push(user)
    }
  }
}
