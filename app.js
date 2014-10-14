(function() {

'use strict';
  var v_problems;
  var v_redAlert;

  
  return {

    requests: {

      findTicket: function(id) {
        return{
          url: '/api/v2/tickets/' + id + '.json',
          dataType: 'json',
          type: 'GET'
        };
      },

      searchTickets: function(tags) { //Send the broadcast message
        return {
          url: '/api/v2/search.json?query=ticket_type:problem+status<solved' + tags,
          dataType: 'json',
          type : 'GET'
        };
      },
      searchRedAlerts: function(){
        return {
          url: '/api/v2/search.json?query=ticket_type:problem+priority:urgent+status<solved+tags:' + this.setting('redAlertTag'),
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
      'pane.activated': 'changeIconToNormal',

      // AJAX Events & Callbacks

      // DOM Events
      'click .link_issue' : 'linkTicket',
      'click .link' : 'previewLink',
      'click .clear_notifications' : 'clearPopover'

    },

    clearPopover: function(){
      var container = this.$("#notification_container");
      container.empty();
    },

    changeIconToNormal: function() {
      this.setIconState('active', this.assetURL('icon_top_bar_active.png'));
      this.setIconState('inactive', this.assetURL('icon_top_bar_inactive.png'));
      this.setIconState('hover', this.assetURL('icon_top_bar_hover.png'));
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
        this.setIconState('active', this.assetURL('icon_top_bar_active_notif.png'));
        this.setIconState('inactive', this.assetURL('icon_top_bar_active_notif.png'));
        this.setIconState('hover', this.assetURL('icon_top_bar_active_notif.png'));
        services.notify(updatedAt.toUTCString() +' Ticket <a href="'+this.setting('subdomain')+'/agent/tickets/' + body + '">#'+ body +'</a> has been updated and currently has a priority of Urgent.', 'alert');
        var container = this.$("#notification_container");
        container.prepend( '<div class="alert">'+updatedAt.toUTCString() +' Ticket <a href="'+this.setting('subdomain')+'/agent/tickets/' + body + '">#'+ body +'</a> has been updated and currently has a priority of Urgent.</div>');
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
        this.switchTo('showalerts');
      }else{
        var tags = this.setting('tags');
        var tags_splitted = tags.split(" ");
        var search_string = "";
        for(var i=0;i<tags_splitted.length;i++){
          search_string+="+tags:"+tags_splitted[i];
        }
        var request = this.ajax('searchTickets', search_string);
        request.done(function(v_problems){

          var g_problems = _.map(v_problems.results, function(prob){return prob.assignee_id});
          console.log(g_problems);
          var request = this.ajax('searchRedAlerts');
          request.done(function(v_redAlert){
            this.switchTo('showinfo',{
              "problems": v_problems.results,
              "redAlert": v_redAlert.results
            })
          });
        });
      }
    }

  };

}());
