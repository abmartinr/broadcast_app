(function() {

    'use strict';
    var v_problems;
    var v_redAlert;


    return {

        requests: {

            findTicket: function(id) {
                return {
                    url: '/api/v2/tickets/' + id + '.json',
                    dataType: 'json',
                    type: 'GET'
                };
            },

            createView: function() {
                return {
                    url: '/api/v2/views.json',
                    type: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        'view': {
                            'title': 'broadcast_app_view',
                            'all': [{
                                'field': 'status',
                                'operator': 'less_than',
                                'value': 'solved'
                            }, {
                                'field': 'current_tags',
                                'operator': 'includes',
                                'value': this.setting('redAlertTag') + ' ' + this.setting('tags')
                            }]
                        }
                    })
                };
            },

            syncTagsRequest: function() {
                return {
                    url: '/api/v2/views/' + this.setting('view_id') + '.json',
                    type: 'PUT',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        'view': {
                            'title': 'broadcast_app_view',
                            'all': [{
                                'field': 'status',
                                'operator': 'less_than',
                                'value': 'solved'
                            }, {
                                'field': 'current_tags',
                                'operator': 'includes',
                                'value': this.setting('redAlertTag') + ' ' + this.setting('tags')
                            }]
                        }
                    })
                };
            },
            getTicketsFromView: function() {
                return {
                    // /api/v2/views/{id}/tickets.json
                    url: '/api/v2/views/' + this.setting('view_id') + '/tickets.json',
                    dataType: 'json',
                    type: 'GET'
                };
            },
            getAllViews: function(){
                return {
                    // /api/v2/views.json
                    url: '/api/v2/views.json',
                    dataType: 'json',
                    type: 'GET'
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
            },
            getGroups: function() {
                return {
                    url: '/api/v2/groups.json',
                    dataType: 'json',
                    type: 'GET'
                };
            }

        },

        events: {

            // Lifecycle Events
            'app.activated': 'loadData',
            'ticket.save': 'checkUrgent',
            'notification.popMessage': 'doPopMessage',
            'pane.activated': 'changeIconToNormal',

            // AJAX Events & Callbacks

            // DOM Events
            'click .link_issue': 'linkTicket',
            'click .plink': 'previewLink',
            'click .create_view': 'createViewFunc',
            'click .update_view': 'syncTags',
            'click .send_notification': 'sendNotification',
            'click .clear_input' : function(){
              this.$("input#message_input").val('');  
            },
            'click .toggle-app': 'toggleAppContainer',
            'click .clear_notifications': 'clearPopover'

        },


        toggleAppContainer: function(){
            var $container = this.$('.app-container'),
            $icon = this.$('.toggle-app i');

            if ($container.is(':visible')){
                $container.hide();
                $icon.prop('class', 'icon-plus');
            } else {
                $container.show();
                $icon.prop('class', 'icon-minus');
            }
        },
        sendNotification: function() {
            if(this.$("input#message_input").val() != ''){
                var data = {
                    "type": "MANUAL",
                    "requester": this.currentUser().name(),
                    "message": this.$("input#message_input").val(),
                    "group_id": this.$("select#group_input").val()
                }
                this.$("input#message_input").val('');
                this.ajax('notifyAgents', data).done(function() {
                    return true;
                });
            }
        },

        createViewFunc: function() {
            var check_req = this.ajax('getAllViews');
            check_req.done(function(data){
                var res = true;
                console.log(data);
                for(var i = 0; i<data.views.length;i++){
                    if(data.views[i].title == "broadcast_app_view"){
                        res=false;
                        break;
                    }
                }
                if(res){
                var request = this.ajax('createView');
                request.done(function(data) {
                    alert('The View with the ID ' + data.view.id + ' has been created. Please copy it and paste in your SETTINGS.');
                });
                }else{
                    var question = confirm('There is already a view for this app. Clicking ok will create a new one. Are you sure you want to continue?');
                    if(question){
                       var request = this.ajax('createView');
                        request.done(function(data) {
                            alert('The View with the ID ' + data.view.id + ' has been created. Please copy it and paste in your SETTINGS.');
                        }); 
                    }
                }
            });       
        },
        syncTags: function() {
            var request = this.ajax('syncTagsRequest');
            request.done(function() {
                alert('The view has been updated and all the tags are now correctly sync');
            });
        },
        clearPopover: function() {
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

            if (ticket.priority() == 'urgent' && ticket.type() == 'problem') {
                var data = {
                    "type": "AUTO",
                    "id": ticket.id(),
                    "subject": ticket.subject(),
                    "tags": ticket.tags()
                }

                this.ajax('notifyAgents', data).done(function() {
                    return true;
                });
            } else {
                return true;
            }
        },

        doPopMessage: function(body) {
            var currentLocation = this.currentLocation();
            var updatedAt = new Date();
            var container = this.$("#notification_container");
            if (currentLocation == "top_bar") {
                if (body.type == "MANUAL") {
                    var current_user = this.currentUser().groups();
                    var groups = _.map(current_user, function(group){ return group.id(); });
                    if (_.contains(groups, parseInt(body.group_id))) {
                        this.setIconState('active', this.assetURL('icon_top_bar_active_notif.png'));
                        this.setIconState('inactive', this.assetURL('icon_top_bar_active_notif.png'));
                        this.setIconState('hover', this.assetURL('icon_top_bar_active_notif.png'));
                        services.notify(updatedAt.toUTCString().replace(' GMT', '') + ' ' + body.requester + ' ' + body.message, 'alert');
                        container.prepend('<div class="alert alert-warning">' + updatedAt.toUTCString().replace(' GMT', '') + ' <strong>' + body.requester + '</strong>: ' + body.message);
                    }
                } else {
                    this.setIconState('active', this.assetURL('icon_top_bar_active_notif.png'));
                    this.setIconState('inactive', this.assetURL('icon_top_bar_active_notif.png'));
                    this.setIconState('hover', this.assetURL('icon_top_bar_active_notif.png'));
                    if (_.contains(body.tags, this.setting('redAlertTag'))) {
                        services.notify(updatedAt.toUTCString().replace(' GMT', '') + ' Red Alert <a href="' + this.setting('subdomain') + '/agent/tickets/' + body.id + '">#' + body.id + '</a> has been updated and currently has a priority of Urgent.', 'alert');
                        container.prepend('<div class="alert alert-danger">' + updatedAt.toUTCString().replace(' GMT', '') + '<br/> Red Alert <a href="' + this.setting('subdomain') + '/agent/tickets/' + body.id + '">#' + body.id + '</a> has been updated and currently has a priority of Urgent.</div>');
                    } else {
                        services.notify(updatedAt.toUTCString().replace(' GMT', '') + ' Problem Ticket <a href="' + this.setting('subdomain') + '/agent/tickets/' + body.id + '">#' + body.id + '</a> has been updated and currently has a priority of Urgent.', 'alert');
                        container.prepend('<div class="alert alert-info">' + updatedAt.toUTCString().replace(' GMT', '') + '<br/> Problem Ticket <a href="' + this.setting('subdomain') + '/agent/tickets/' + body.id + '">#' + body.id + '</a> has been updated and currently has a priority of Urgent.</div>');
                    }
                }
            }
        },

        linkTicket: function(obj) {

            var problemID = obj.target.id;
            var currentTicket = this.ticket();
            currentTicket.type('incident');
            currentTicket.customField('problem_id', problemID);
            //alert('You have succesfully linked the ticket #'+currentTicket.id() + ' to problem #' +problemID);
        },

        loadData: function(data) {
            if (this.currentLocation() == 'top_bar') {
                if (data.firstLoad) {
                    this.popover('show');
                    this.popover('hide');
                }
                var tag = this.setting('redAlertTag');

                var request = this.ajax('getTicketsFromView');
                request.done(function(v_redAlert, app) {
                    var red_alerts = _.filter(v_redAlert.tickets, function(ticket) {
                        return _.contains(ticket.tags, tag);
                    });
                    this.switchTo('showalerts', {
                        "redAlert": red_alerts
                    });
                });
            } else {
                var tags = this.setting('tags');
                var tags_splitted = tags.split(" ");
                var search_string = "";
                var red_alert_tag = this.setting('redAlertTag');
                for (var i = 0; i < tags_splitted.length; i++) {
                    search_string += "+tags:" + tags_splitted[i];
                }
                var request = this.ajax('getTicketsFromView');
                request.done(function(results) {
                    var only_problems = _.filter(results.tickets, function(ticket) {
                        for (var i = 0; i < tags_splitted.length; i++) {
                            if (_.contains(ticket.tags, tags_splitted[i])) {
                                return true;
                            }
                        }
                    });
                    var g_problems = _.groupBy(only_problems, function(prob){
                    for(var i=0;i<tags_splitted.length;i++){
                      if(_.contains(prob.tags, tags_splitted[i])){
                        return tags_splitted[i];
                      }
                    }
                  });
                    var red_alerts = _.filter(results.tickets, function(ticket) {
                        return _.contains(ticket.tags, red_alert_tag);
                    });
                    var requestGroups = this.ajax('getGroups');
                    requestGroups.done(function(results_groups) {
                        this.switchTo('showinfo', {
                            "problems": g_problems,
                            "redAlert": red_alerts,
                            "tags_splitted": tags_splitted,
                            "groups": results_groups.groups
                        });
                    });
                });

            }
        }

    };

}());