(function() {

  return {
    events: {
      'app.activated':'checkGroup',
      'broadcastListener' : 'broadcastReceived',
      'click .notify_button' :  function() {
    		this.ajax('sendBroadcast', "This is the message").done(function(){return true;});
      	}
      },
    //Send the broadcast message
    requests: {
      sendBroadcast : function(data){
      	return{
      		url: '/api/v2/apps/notify',
      		type: 'POST',
      		contentType: 'aplication/json',
      		data: JSON.stringify({
      			"app_id" : 0,
      			"event" : "broadcastListener",
      			"body" : data
      		})
      	}
      }
	},
    //We receive the request and set the alerts
    broadcastReceived: function(body) {
    	alert(body);
    },
    //We check the group to see which interface to load.
    checkGroup: function() {
    	var admin = false;
    	var groups = this.currentUser().groups();
    	for(var i = 0 ; i< groups.length; i++){
    		if (groups[i].id() == this.setting('sender') ){
    			admin = true;
    		}
    	}
    	if(admin){
    		this.switchTo('admin');
    	}else{
    		this.switchTo('agent');
    	}
    }



  };

}());
