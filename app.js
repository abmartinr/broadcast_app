(function() {

'use strict';

  
  return {
    //Send the broadcast message
    requests: {
      searchTickets: function() {
        return{
          url: '/api/v2/search.json?query=ticket_type:Problem+priority:Urgent+status<solved+tags:'+this.setting('tag'),
          dataType: "json",
          type : 'GET'
        }
      },
    },
    events: {
      'app.activated':'loadData',
      'click .link_ticket' : 'linkTicket'
      },
    //We check the group to see which interface to load.
    loadData: function() {
      var request = this.ajax('searchTickets');
      request.done(function(data){
        this.switchTo('showinfo', data);
      });
    },
    linkTicket: function(obj){
      
      var problemID = obj.target.id;
       //this.ticket.type('Incident');
       var currentTicket = this.ticket();
       currentTicket.type('incident');
       currentTicket.customField('problem_id', problemID);
    }
  };

}());
