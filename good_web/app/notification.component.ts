import { Component, Injectable } from '@angular/core';
import { NgModule, OnInit, Input}      from '@angular/core';
import { Router} from '@angular/router';
import { StatsData } from './data-class';
import { GoodJobService } from './good-job.service';
import { PhoenixChannelService } from './phoenix.channels.service'
import { MessageService } from "./message-service";

@Component({
  selector: 'live-notifications',
  templateUrl: 'app/template/notification.html'
})

@Injectable()
export class GoodNotification{
  notifications: string[] = []
  socket: any
  size: number
 
  constructor(private goodJobService: GoodJobService, phoenixChannel: PhoenixChannelService, private router: Router, private messageService: MessageService) {
     phoenixChannel.socket.connect();
     console.log('Constructed');
     let channel_name: string = "notifications:" + goodJobService.get_user().company
     console.log(channel_name)
     let channel = phoenixChannel.socket.channel(channel_name)
     
     channel.on("update", (msg: any) => this.update(msg) )

     channel.join()
     .receive("ok", (messages: any) => console.log("catching up", messages) )      .receive("error", ({reason}) => console.log("failed join", reason) )
     .receive("timeout", () => console.log("Networking issue. Still waiting...") )

     this.notifications.push("test1")
     this.notifications.push("test2")
     this.size = this.notifications.length
     console.log(this.notifications)
  }

  update(notification: any){
    console.log(notification)
    this.notifications.push(notification.message)
    this.messageService.sendLike(notification)
    this.size = this.size + 1
  }

  remove_notification(i: number){
    console.log(i)
    delete this.notifications[i]
    this.size = this.size - 1
  }

//for notification bar
    logout(event: any){
        this.goodJobService.logout();
        this.router.navigate(['/start'])
    }

    settings(event: any){
        this.router.navigate(['/app/settings'])
    }

    home(event: any){
        this.router.navigate(['/app'])
    }

}