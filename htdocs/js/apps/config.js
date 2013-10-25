/***
 *  This object contains many common things needed by all other objects
 *
 **/


define(['Backbone','moment','backbone-validation','stickit','jquery-ui'], function(Backbone,moment){

    $(document).ajaxError(function (e, xhr, options, error) {
      if(xhr.responseText){
        try {
            var response = JSON.parse(xhr.responseText);

            if(response && response.type=="login"){
                console.log(response.msg);
            }
        } catch (error){
            console.log(xhr.responseText);
        }
      }

    });
    
    var config = {
        urlPrefix: "/webwork3/",
        courseSettings: {
            "session_key": $("#hidden_key").val(),
            "user": $("#hidden_user").val(),
            "courseID": $("#hidden_courseID").val(),
        },
        checkForError: function(response){
            if (response && response.error){
                console.log("need to handle this somehow");
                console.log(response);
            }
        },
            
    
    // Note: these are in the order given in the classlist format for LST files.  
    
        userProps: [{shortName: "student_id", longName: "Student ID", regexp: "student"},
                     {shortName: "last_name", longName: "Last Name", regexp: "last"},
                     {shortName: "first_name", longName: "First Name", regexp: "first"},
                     {shortName: "status", longName: "Status", regexp: "status"},
                     {shortName: "comment", longName: "Comment", regexp: "comment"},
                     {shortName: "section", longName: "Section", regexp: "section" },
                     {shortName: "recitation", longName: "Recitation", regexp: "recitation"},
                     {shortName: "email_address", longName: "Email", regexp: "email"},
                     {shortName: "user_id", longName: "Login Name", regexp: "login"},
                     {shortName: "userpassword", longName: "Password", regexp: "pass"},
                     {shortName: "permission", longName: "Permission Level", regexp: "permission"}
                     ],
    
        userTableHeaders : [
            { name: "Select", datatype: "boolean", editable: true},
            { name: "Action", datatype: "string", editable: true,
                        values: {"action1":"Change Password",
                            "action2":"Delete User","action3":"Act as User",
                            "action4":"Student Progess","action5":"Email Student"}
                    },
            { label: "Login Name", name: "user_id", datatype: "string", editable: false },
            { label: "Assigned Sets", name: "num_user_sets", datatype: "string", editable: false },
            { label: "First Name", name: "first_name", datatype: "string", editable: true },
            { label: "Last Name", name:"last_name", datatype: "string", editable: true },
            { label: "Email", name: "email_address", datatype: "string", editable: true },
            { label: "Student ID", name: "student_id", datatype: "string", editable: true },
            { label: "Status", name: "status", datatype: "string", editable: true,
                values : {
                    "en":"Enrolled",
                    "noten":"Not Enrolled"
                }
            },
            { label: "Section", name: "section", datatype: "integer", editable: true },
            { label: "Recitation", name: "recitation", datatype: "integer", editable: true },
            { label: "Comment", name: "comment", datatype: "string", editable: true },
            { label: "Permission", name: "permission", datatype: "integer", editable: true,
                values : {
                    "-5":"guest","0":"Student","2":"login proctor",
                    "3":"grade proctor","5":"T.A.", "10": "Professor",
                    "20":"Admininistrator"
            }
        }
        
    ],
    // the following is needed for the editable grid in the "Manage Problem Sets View"
        problemSetHeaders : [
            {name: "delete_set", label: "Delete"},
            {name: "set_id", label: "Name", datatype: "string", editable: false},
            {name: "users_assigned", label: "Num. of Users Assigned", datatype: "string", editable: false},
            {name: "num_problems", label: "Num. of Problems", datatype: "string", editable: false},
            {name: "enable_reduced_scoring", label: "Reduced Scoring", datatype: "string",editable: true,
                values: {"0": "No", "1": "Yes"}},
            {name: "visible", label: "Visible", datatype: "string",editable: true,
                values: {"0": "No", "1": "Yes"}},
            {name: "open_date", label: "Open Date", datatype: "integer", editable: true},
            {name: "due_date", label: "Due Date", datatype: "integer", editable: true},
            {name: "answer_date", label: "Answer Date", datatype: "integer", editable: true}
            ],
        permissions : [{value: -5, label: "guest"},{value: 0, label: "student"},{value: 2, label: "login proctor"}, 
                        {value: 3, label: "T.A."},{value: 10, label: "professor"}, {value: 20, label: "administrator"}],

        regexp : {
            wwDate:  /^((\d?\d)\/(\d?\d)\/(\d{4}))\sat\s((0?[1-9]|1[0-2]):([0-5]\d)([aApP][mM]))\s([a-zA-Z]{3})/,
            number: /^\d*(\.\d*)?$/
        },
        parseWWDate: function(str) {
            // this parses webwork dates in the form MM/DD/YYYY at HH:MM AM/PM TMZ
            // and returns the date (as a moment object) and the timezone (as a string)

            var parsedDate = config.regexp.wwDate.exec(str);



            if (parsedDate) {
                var timePart = moment(parsedDate[5],"hh:mmA");
                var date = moment(parsedDate[1],"MM/DD/YYYY").hours(timePart.hours()).minutes(timePart.minutes());
                        
                return {"date": date, "time_zone": parsedDate[9]};
            }
        }
    }

    // These are additional validation patterns to be available to Backbone Validation

    _.extend(Backbone.Validation.patterns, { "wwdate": config.regexp.wwDate}); 
    _.extend(Backbone.Validation.patterns, { "setname": /^[\w\d\_\.]+$/});
    _.extend(Backbone.Validation.patterns, { "loginname": /^[\w\d\_]+$/});
    _.extend(Backbone.Model.prototype, Backbone.Validation.mixin);  

    // This implements a stickit handler for elements of type wwdate
    // see https://github.com/NYTimes/backbone.stickit for more info.
    //
    // This takes a webwork date-time (for open_date, due-date, etc.) and creates a pair of html spans to handle 
    // the date and time separately
    //
    // note, pstaab: I think the Handler ".edit-datetime" is better.  Need to check where .ww-datetime is used

    Backbone.Stickit.addHandler({
      selector: '.ww-datetime',
      initialize: function($el, model, options) {
        var setModel = function (evt) {
            console.log("saving the model");
            var datePart = evt.data.$el.children(".wwdate").val();
            var timePart = evt.data.$el.children(".wwtime").text().trim();
            var timeZone = config.parseWWDate(evt.data.model.get(evt.data.options.observe)).time_zone;

            evt.data.model.set(evt.data.options.observe,datePart + " at " + timePart + " " + timeZone);
            
        }; 
        $el.children(".wwdate").on("change",{"$el": $el, "model": model, "options": options}, setModel);
        $el.children(".wwtime").on("blur",{"$el": $el, "model": model, "options": options}, setModel);
        $el.children(".wwdate").datepicker();

      },
      updateMethod: 'html',
      //update: function($el, val, model, options) { $el.val(val); }
      onGet: function(val) { 

        var theDate = config.parseWWDate(val);
        return '<input class="wwdate" size="12" value="' + theDate.date.format("MM/DD/YYYY") + '"> at ' +
                '<span class="wwtime" contenteditable="true"> ' + theDate.date.format("hh:mmA") + '</span>'; 
        }
    });

    Backbone.Stickit.addHandler({
        selector: '.show-datetime',
        onGet: function(val){
            return moment(val).format("MM/DD/YYYY [at] hh:mmA");
        }
    })

    // The main stickit handler for any editable date-time class.

    Backbone.Stickit.addHandler({
        selector: '.edit-datetime',
        update: function($el, val, model, options){
           var theDate = moment.unix(val);
            $el.html(_.template($("#edit-date-time-template").html(),{date: theDate.format("MM/DD/YYYY")}));
                        var setModel = function(evt,timeStr){
                console.log("in edit-datetime, setModel");
                var dateTimeStr = evt.data.$el.children(".wwdate").val() + " " + 
                        (timeStr ? timeStr : evt.data.$el.children(".wwtime").text().trim());
                var date = moment(dateTimeStr,"MM/DD/YYYY hh:mmA");
                evt.data.model.set(evt.data.options.observe,""+date.unix()); 
            };
            var popoverHTML = _.template($("#time-popover-template").html(),
                        {time : moment.unix(model.get(options.observe)).format("h:mm a")});
            var timeIcon = $el.children(".open-time-editor");
            timeIcon.popover({title: "Change Time:", html: true, content: popoverHTML,
                trigger: "manual"});
            timeIcon.parent().delegate(".btn","click",{$el:$el.closest(".edit-datetime"), model: model, options: options},
                function (evt) {
                    timeIcon.popover("hide");
                    setModel(evt,$(this).siblings(".wwtime").val());
            });
            $el.children(".wwdate").on("change",{"$el": $el, "model": model, "options": options}, setModel);
            $el.children(".wwtime").on("blur",{"$el": $el, "model": model, "options": options}, setModel);
            timeIcon.parent().on("click",".open-time-editor", function() {
                timeIcon.popover("toggle");
            });
            $el.children(".wwdate").datepicker();

        },
        updateMethod: 'html'
    });

    Backbone.Stickit.addHandler({
        selector: ".show-datetime",
        onGet: function(val) {  // this is passed in as a moment Object
            console.log(val);
            var theDate = moment.unix(val);
            var tz = (theDate.toDate() + "").match(/\((.*)\)/)[1];
            return theDate.format("MM/DD/YYYY") + " at " + theDate.format("hh:mmA") + " " + tz;
        }
      
    });

    Backbone.Stickit.addHandler({
        selector: '.select-with-disables',
        getVal: function($el) { 
                return $el.val(); 
        }, 

        update: function($el, val, model, options) { 
            $el.html("");

            var disabledOptions  = eval(options.selectOptions.disabledCollection);

           _(eval(options.selectOptions.collection)).each(function(item){
                $el.append("<option value='"+item.value+"' >" + item.label + "</option>");
            });

            _(disabledOptions).each(function(user){
                $el.children("option[value='" + user + "']").prop("disabled",true);
            })

            _(val).each(function(user){
              $el.children("option[value='" + user + "']").prop("selected",true);  
            })


            }
    });

    function DeleteCellRenderer(config) {
      this.init(config);
    }

    DeleteCellRenderer.prototype = new CellRenderer();
    DeleteCellRenderer.prototype.render  = function(_cell,_value){
              $(_cell).html("<button class='btn btn-small'><i class='icon-trash'></i></button>")
                  .on("click", {obj: this, cell: _cell, value: _value}, this.deleteRow); };

    DeleteCellRenderer.prototype.deleteRow = function(evt) {
      var row =  evt.data.obj.editablegrid.getRowIndex($(evt.data.cell).parent().attr("id").split("_")[1]);
      evt.data.obj.editablegrid.modelChanged.call(evt.data.obj.editablegrid,row,0,"","delete")

                  };
    config.deleteCellRenderer = new DeleteCellRenderer();

    return config;
});