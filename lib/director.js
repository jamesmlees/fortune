var RSVP = require("rsvp"),
    _ = require("lodash");

module.exports = function(){
  var handlers = {};

  var createRequest = function(opt){
    var req = {
      direct: true,
      headers: {
        "content-type": "application/json"
      },
      get: function(h){ return this.headers[h]; },
      params: opt.params || {},
      query: opt.query || {},
      body: opt.body
    };

    if(_.isArray(req.params.id)) req.params.id = req.params.id.join(",");

    return req;
  };

  var createResponse = function(){
    var deferred = RSVP.defer(),
        res = {
          set: function(){},
          setHeader: function(){},
          send: function(status, body){
            deferred.resolve(body && JSON.parse(body));
          },
          promise: deferred.promise
        };

    return res;
  };

  var asSingleOrCollection = function(method, collection, query,options){
    var req, res;

    options = options || {};
    
    if((_.isObject(query) && !_.isArray(query)) || !query){
      handlers[collection][method + "All"](req = createRequest(_.extend({query: query},
                                                                        options.query)),
                                           res = createResponse());
    }else{
      handlers[collection][method](req = createRequest({
        params: {id: query},
        query: options.query
      }), res =  createResponse());
    }
    return _.extend(res.promise,{req: req, res: res});
  };

  return {
    methods: {
      create: function(collection, data, options){
        var body = {},
            req, res;

        data = _.cloneDeep(data);

        body[collection] = _.isArray(data) ? data : [data];

        handlers[collection].create(req = createRequest({body: body}),
                                    res = createResponse());

        return _.extend(res.promise,{req: req, res: res});;
      },
      get: function(collection,query, options){
        return asSingleOrCollection("get", collection, query, options);
      },
      destroy: function(collection,query, options){
        return asSingleOrCollection("destroy", collection, query, options);
      },
      replace: function(collection, id, data, options){
        var body = {},
            req,res;

        data = _.cloneDeep(data);

        body[collection] = _.isArray(data) ? data : [data];
        
        handlers[collection].replace(req = createRequest({body:body, params: {id: id}}),
                                     res = createResponse());
        return _.extend(res.promise,{req: req, res: res});
      },
      update: function(collection, id, data, options){
        var body = [],
            req, res;

        handlers[collection].update(req = createRequest({
          body: data,
          params:{
            id: _.isArray(id) ? id.join(",") : id
          } 
        }), res = createResponse());

        return _.extend(res.promise,{req: req, res: res});
      }
    },
    registerResource: function(collection, callbacks){ 
      var handlerNames = [ "create", "update", "replace", "destroy", "destroyAll", "get", "getAll" ];
      if(!_.isEqual(_.keys(callbacks), handlerNames)){
        throw new Error("Wrong route handler names");
      }
      handlers[collection] = callbacks;
    }
  };
};