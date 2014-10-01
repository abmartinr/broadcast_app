(function() {

'use strict';

  
  return {

    requests: {

      findTicket: function(id) {
        return{
          url: '/api/v2/tickets/' + id + '.json',
          dataType: 'json',
          type: 'GET'
        };
      },

      searchTickets: function() { //Send the broadcast message
        return {
          url: '/api/v2/search.json?query=ticket_type:problem+priority:urgent+status<solved+tags:' + this.setting('tag'),
          dataType: 'json',
          type : 'GET'
        };
      },

      notifyAgents: function(data) {
        return {
            url: '/api/v2/apps/notify.json',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
              "app_id": this.id(),
              "event": "popMessage",
              "body": data
            })
        };
      }

    },

    events: {

      // Lifecycle Events
      'app.activated':'loadData',
      'ticket.save': 'checkUrgent',
      'notification.popMessage':'doPopMessage',

      // AJAX Events & Callbacks

      // DOM Events
      'click .link_issue' : 'linkTicket',
      'click .link' : 'previewLink'

    },

    checkUrgent: function() {
      var ticket = this.ticket();
      
      if (ticket.priority() == 'urgent') {
        var data = ticket.id();
        this.ajax('notifyAgents', data).done( function(){ return true; });
      } else {
        return true;
      }
    },

    doPopMessage: function(body) {
      var currentLocation = this.currentLocation();
      var updatedAt = new Date();
      if(currentLocation == "top_bar"){
        services.notify(updatedAt.toUTCString() +' Ticket <a href="'+this.setting('subdomain')+'/agent/tickets/' + body + '">#'+ body +'</a> has been updated and currently has a priority of Urgent.', 'alert');
        var container = this.$("#notification_container");
        container.append( '<div class="alert">'+updatedAt.toUTCString() +' Ticket <a href="'+this.setting('subdomain')+'/agent/tickets/' + body + '">#'+ body +'</a> has been updated and currently has a priority of Urgent.</div>');
      }
      
    },

    linkTicket: function(obj){
      var problemID = obj.target.id;
      var currentTicket = this.ticket();
      currentTicket.type('incident');
      currentTicket.customField('problem_id', problemID);
    },

    previewLink: function(event){
      event.preventDefault();
      var id = event.target.id;
      var ticket = this.ajax('findTicket', id);
      ticket.done(function(data){
        var modal = this.$("#detailsModal");
        modal.html(this.renderTemplate('modal', {
          title: data.ticket.subject,
          description: data.ticket.description,
          id: data.ticket.id
        }));
        modal.modal();
      });
    },

    loadData: function() { 
      if(this.currentLocation() == 'top_bar'){
        this.switchTo('showAlerts');
      }else{
        var request = this.ajax('searchTickets');
          request.done(function(data){
            this.switchTo('showinfo', data);
          });
      }
    }

  };

}());
