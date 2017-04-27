import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';
import { Job } from "./data-class";
 
@Injectable()
export class MessageService {
    private subject = new Subject<any>();
    private email = new Subject<any>();
    private chat = new Subject<any>();
    private job_new_like = new Subject<any>();
    private deleteJobMessage = new Subject<any>();
 
    sendJob(job: Job) {
        this.subject.next(job);
    }

    sendLike(email: any) {
        this.job_new_like.next(email);
    }
 
 
    getJob(): Observable<Job> {
        return this.subject.asObservable();
    }

    sendProfileClick(email: string){
        this.email.next(email)
    }

    getProfileClick(): Observable<string>{
        return this.email.asObservable();
    }

    sendChatClick(job_seeker: string, company: string, job: string){
        this.chat.next({job_seeker: job_seeker, company: company, job: job})
    }

    getChatClick(): Observable<any>{
        return this.chat.asObservable();
    }

    sendDeleteJob(job: string){
        this.deleteJobMessage.next(job);
    }

    getDeleteJob(): Observable<any>{
        return this.deleteJobMessage.asObservable();
    }

    getJobLike(): Observable<any>{
        return this.job_new_like.asObservable();
    }
}