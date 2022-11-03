const axios = require('axios');
var qs = require('qs');
// SC => Top Level Subclasses only
// SN => Subclass with children nodes
// IN => Instances of
require('dotenv').config();

const BASE_URL = process.env.SPAQRL_ENDPOINT;
const endpointUrl = BASE_URL + 'sparql'

// Get AI Task - SN <https://purl.org/heals/eo#AITask>
module.exports.getAITasks = async (req, res) => {
  try {
    getQueryForClassesWithChildren('https://purl.org/heals/eo#AITask').then(function (response) {
      res.status(200).json(response)
    }).catch(function (error) {
      console.log(error);
      res.status(500).json(error);
    });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

module.exports.getKnowledgeLevel = async (req, res) => {
  try {
    getQueryForInstances('user', 'KnowledgeLevel').then(function (response) {
      res.status(200).json(response)
    }).catch(function (error) {
      console.log(error);
      res.status(500).json(error);
    });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

// HELPER FUNCTIONS
function getQueryForInstances(ontology, parent) {

  try {
    const query = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    
    SELECT ?class ?label
    WHERE {
        ?class rdf:type <http://www.w3id.org/iSeeOnto/`+ ontology + `#` + parent + `> .
        ?class rdfs:label ?label .
    }
    order by ?class`;

    var data = qs.stringify({
      'query': query
    });
    var config = {
      method: 'post',
      url: endpointUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: data
    };

    return axios(config)
      .then(function (response) {
        const parsed = parseClasses(response);
        return parsed;
      })
      .catch(function (error) {
        return { message: "SPARQL SERVER QUERY ERROR - Inner", error: error.response ? error.response.data : error };
      });

  } catch (error) {
    return { message: "SPARQL SERVER QUERY ERROR - Outer", error: error };
  }

}


function getQueryForClassesWithChildren(rootKey) {
  try {
    const query = `
    prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT distinct ?class ?label ?parent
    WHERE {
        ?class rdfs:label ?label .
        ?class rdfs:subClassOf* <`+rootKey+`>.
  		?class rdfs:subClassOf ?parent
    }
    order by ?class`;


    var data = qs.stringify({
      'query': query
    });
    var config = {
      method: 'post',
      url: endpointUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: data
    };

    return axios(config)
      .then(function (response) {
        const parsed = parseWithChildren(response, rootKey);
        return parsed;
      })
      .catch(function (error) {
        return { message: "SPARQL SERVER QUERY ERROR - Inner", error: error.response ? error.response.data : error };
      });

  } catch (error) {
    return { message: "SPARQL SERVER QUERY ERROR - Outer", error: error };
  }

}

function parseClasses(data) {
  var parse = [];
  const results = data.data.results.bindings;
  results.forEach(c => {
    parse.push({ "key": c.class.value, "label": c.label.value })
  });
  return parse;
}

function parseWithChildren(data, rootKey) {
  var parse = [];
  const results = data.data.results.bindings;
  results.forEach(c => {
    parse.push({ "key": c.class.value, "label": c.label.value, "parent": c.parent.value })
  });

  var nodes = {}
  var root = new Node(rootKey,rootKey, rootKey)
  nodes[rootKey] = root;

  parse.forEach(c => {
    var n = new Node(c.key, c.label, c.parent)
    nodes[c.key] = n
  })

  parse.forEach(c => {
    var temp = nodes[c.parent];
    // Only if a parent exists add it
    if(temp){
      temp.addChild(nodes[c.key])
    }
  })

  return nodes[rootKey]
}

// Required for subclasses based methods
class Node {
  constructor(key, label, parent) {
    this.key = key;
    this.label = label;
    this.parent = parent;
    this.children = [];
  }
  addChild(child) {
    this.children.push(child)
  }
}
