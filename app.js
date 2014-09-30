(function() {

'use strict';

  
  return {

    requests: {

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
      'notification.popMessage':'doPopMessage'

      // AJAX Events & Callbacks

      // DOM Events
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

    // linkTicket: function(obj){
      
    //   var problemID = obj.target.id;
    //   console.log(problemID);
    //       currentTicket = this.ticket(),
    //       currentTicket.type('incident'),
    //       currentTicket.customField('problem_id', problemID);
    // },

    loadData: function() { //We check the group to see which interface to load.
      var request = this.ajax('searchTickets');
          request.done(function(data){
            this.switchTo('showinfo', data);
          });
    }

  };

}());
