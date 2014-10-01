(function() {

'use strict';

  
  return {

    requests: {

      findTicket: function(id) {
        return{
          url: '/api/v2/tickets/'+id+'.json',
          dataType: 'json',
          type: 'GET'
        }
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
        var data = 'Ticket ID ' + ticket.id() + ' has been updated and currently has a priority of Urgent.';
        this.ajax('notifyAgents', data).done( function(){ return true; });
      } else {
        return true;
      }
    },

    doPopMessage: function(body) {
      var currentLocation = this.currentLocation();
      if(currentLocation == "top_bar"){
        services.notify(body, 'error');
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
      ticket.always(function(data){
        console.log(data.ticket.id);
        var modal = this.$("#detailsModal");
        modal.html(this.renderTemplate('modal', {
          title: data.ticket.subject,
          description: data.ticket.description,
          id: data.ticket.id
        }));
        modal.modal();
      });
    },


    loadData: function() { //We check the group to see which interface to load.
      var request = this.ajax('searchTickets');
          request.done(function(data){
            this.switchTo('showinfo', data);
          });
    }

  };

}());
