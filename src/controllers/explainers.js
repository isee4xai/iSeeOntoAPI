const axios = require('axios');
var qs = require('qs');
const { v4 } = require('uuid');
// SC => Top Level Subclasses only
// SN => Subclass with children nodes
// IN => Instances of
require('dotenv').config();
const UtilService = require("../services/util");

const BASE_URL_EXPLAINERS = process.env.SPAQRL_ENDPOINT_EXPLAINERS;

const endpointUrl = BASE_URL_EXPLAINERS + 'sparql'

module.exports.list = async (req, res) => {
  try {
    const result = await UtilService.explainerList();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

// function selectMultipleVar(variable_count, current_content, variable_content){
//   var variable_name = "";
//   if (variable_count == 0){
//     variable_name = variable_content;
//   } else {
//     variable_name = current_content + ", " + variable_content;
//   }
//   return variable_name;
// }


module.exports.dumpExplainers = async (req, res) => {

  if (req.body.ISEE_ADMIN_KEY != process.env.ISEE_ADMIN_KEY) {
    console.log("Unauth access");
    res.status(400).json({ message: "Unauthorised Access!" })
  } else {
    let URLs = [
      "http://semanticscience.org/ontology/sio.owl",
      "http://www.ontologydesignpatterns.org/schemas/cpannotationschema.owl",
      "http://www.w3.org/ns/prov-o#",
      "https://raw.githubusercontent.com/tetherless-world/explanation-ontology/master/Ontologies/v2/explanation-ontology.owl",
      "http://www.ontologydesignpatterns.org/schemas/cpannotationschema.owl",
      // "https://raw.githubusercontent.com/isee4xai/iSeeOnto/main/iSeeOnto.owl",
      "https://raw.githubusercontent.com/isee4xai/iSeeOnto/main/BehaviourTree.owl",
      "https://raw.githubusercontent.com/isee4xai/iSeeOnto/main/SimilarityKnowledge.owl",
      "https://raw.githubusercontent.com/isee4xai/iSeeOnto/main/aimethodevaluation.rdf",
      "https://raw.githubusercontent.com/isee4xai/iSeeOnto/main/aimodel.rdf",
      "https://raw.githubusercontent.com/isee4xai/iSeeOnto/main/evaluation.rdf",
      "https://raw.githubusercontent.com/isee4xai/iSeeOnto/main/explainer.rdf",
      "https://raw.githubusercontent.com/isee4xai/iSeeOnto/main/explanationexperience.rdf",
      "https://raw.githubusercontent.com/isee4xai/iSeeOnto/main/user.rdf",
      "https://raw.githubusercontent.com/isee4xai/iSeeOnto/main/userevaluation.rdf",
      "https://raw.githubusercontent.com/isee4xai/iSeeOnto/main/workflow.rdf"
    ];

    getAllData(URLs).then(resp => {
      res.status(200).json({ message: resp });
    }).catch(e => {
      res.status(500).json({ message: e });
    })
  }

};

function getAllData(URLs) {
  return Promise.all(URLs.map(fetchData));
}

function fetchData(URL) {
  var data = qs.stringify({
    'update': 'LOAD <' + URL + '>'
  });
  var config = {
    method: 'post',
    url: BASE_URL_EXPLAINERS + 'update',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data: data
  };

  return axios(config)
    .then(function (response) {
      console.log("✅ Success=> " + URL + " - ", JSON.stringify(response.data));
      return "✅ Success=> " + URL + " - " + JSON.stringify(response.data)
    })
    .catch(function (error) {
      console.log("🛑 Error=> ", error);
      console.log("🛑 Error=> " + URL + " - ", JSON.stringify(error.response.data));
      return "🛑 Error=> " + URL + " - " + JSON.stringify(error.response.data)
    });
}


// auxiliar functions to insert multiple values for some object properties
function getMultipleSelectValues(object_property, my_multiple_select_values) {
  var my_values = "";

  if (object_property === "imp_framework_text") {
    for (var i = 0; i < my_multiple_select_values.length; i++) {
      my_values += `VALUES ?` + object_property + i + ` { "` + my_multiple_select_values[i] + `" } . \n`;
    }
  } else {
    for (var i = 0; i < my_multiple_select_values.length; i++) {
      my_values += `VALUES ?` + object_property + i + ` { "` + my_multiple_select_values[i][my_multiple_select_values[i].length - 1] + `" } . \n`;
    }
  };

  return my_values;
}


function getInsertionMultipleValues(object_property, my_multiple_select_values) {
  var my_values = "";
  var my_prefix = "";

  if (object_property === "output_text") {
    my_prefix = `pur:hasPresentation ?expoutput`;
  } else if (object_property === "imp_framework_text") {
    my_prefix = `exp:hasBackend ?imp_framework`;
  } else if (object_property === "aimethod_class_text") {
    my_prefix = `exp:hasApplicableMethodType ?aimethod_class`;
  } else if (object_property === "aitask_class_text") {
    my_prefix = `exp:applicableProblemType ?aitask_class`;
  }

  for (var i = 0; i < my_multiple_select_values.length; i++) {
    my_values += my_prefix + i + ` ; \n`;
  };

  return my_values;
};


function getBindMultipleValues(object_property, my_multiple_select_values) {
  var my_values = "";
  //var my_bind_text = "";
  var my_bind = "";

  if (object_property === "output_text") {
    my_bind = `?expoutput`;
  } else if (object_property === "imp_framework_text") {
    my_bind = `?imp_framework`;
  } else if (object_property === "aimethod_class_text") {
    my_bind = `?aimethod_class`;
  } else if (object_property === "aitask_class_text") {
    my_bind = `?aitask_class`;
  }

  for (var i = 0; i < my_multiple_select_values.length; i++) {
    my_values += `BIND( IRI(?` + object_property + i + `) as ` + my_bind + i + `) . \n`;
  };

  return my_values;
};

// http://localhost:3100/api/onto/getExplainers
/// insert an explainer into the ontology
// http://localhost:3100/api/onto/getExplainers
module.exports.insertExplainer = async (req, res) => {
  if (req.body.ISEE_ADMIN_KEY != process.env.ISEE_ADMIN_KEY) {
    console.log("Unauth access");
    res.status(400).json({ message: "Unauthorised Access!" });
    return;
  } else {
    const data = req.body.data; // json body

    try {
      var presentations = getMultipleSelectValues("output_text", data.presentations);
      var implementation = getMultipleSelectValues("imp_framework_text", data.implementation);
      var ai_method = getMultipleSelectValues("aimethod_class_text", data.ai_methods);
      var ai_task = getMultipleSelectValues("aitask_class_text", data.ai_tasks);

      var presentations_insert = getInsertionMultipleValues("output_text", data.presentations);
      var implementation_insert = getInsertionMultipleValues("imp_framework_text", data.implementation);
      var ai_method_insert = getInsertionMultipleValues("aimethod_class_text", data.ai_methods);
      var ai_task_insert = getInsertionMultipleValues("aitask_class_text", data.ai_tasks);

      var presentations_bind = getBindMultipleValues("output_text", data.presentations);
      var implementation_bind = getBindMultipleValues("imp_framework_text", data.implementation);
      var ai_method_bind = getBindMultipleValues("aimethod_class_text", data.ai_methods);
      var ai_task_bind = getBindMultipleValues("aitask_class_text", data.ai_tasks);

      const query = `
			
			prefix exp: <http://www.w3id.org/iSeeOnto/explainer#> 
				prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
				prefix owl: <http://www.w3.org/2002/07/owl#>
				prefix pur: <https://purl.org/heals/eo#>
				prefix rsc: <http://semanticscience.org/resource/>
				prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>


				INSERT {
								  
					?technique rdfs:label ?tech_text ;
									   rdf:type ?explainability_technique ; 
									   rdf:type owl:NamedIndividual ; 
									   exp:isCompatibleWithFeatureTypes ?datasetType ; 
									   exp:hasConcurrentness ?concurrentness ; 
									   exp:hasExplanationScope ?scope ; 
									   exp:hasPortability ?portability ; 
									   exp:targetType ?target_type ; 
									   exp:hasOutputType  ?explanation_type_class ; 
									   ` + presentations_insert + ai_method_insert + ai_task_insert + `
									   exp:hasComplexity ?complexity .
								
								
					?explainer rdfs:label ?exp_text ;
							   rdfs:comment ?comment_metadata ;
							   rdfs:comment ?comment_explainer_description ;
							   rdfs:comment ?comment_explanation_description ;
							 rdf:type exp:Explainer ; 
							 rdf:type owl:NamedIndividual ;
							 exp:utilises ?technique ;
               ` + implementation_insert + `
               exp:has_model_access ?model_access ;
               exp:needs_training_data ?training_data .														 										
				} WHERE {
					VALUES ?isee { "http://www.semanticweb.org/isee/iseeonto/2022/9/30#" } .
					VALUES ?exp_iri { "http://www.w3id.org/iSeeOnto/explainer#" } . 
					VALUES ?ai_iri { "http://www.w3id.org/iSeeOnto/aimodel#" } .
					VALUES ?purl_iri { "https://purl.org/heals/eo#" } .
			
					# this is the block of values we have to change for each insertion
					VALUES ?exp_tech_type_text { "`+ data.technique[data.technique.length - 1] + `" } . # we have to edit here the type of the explainability technique
					VALUES ?comment_metadata { "META_DESCRIPTION=None" } .
					VALUES ?comment_explainer_description { "EXPLAINER_DESCRIPTION=`+ data.explainer_description + `" } .
					VALUES ?comment_explanation_description { "EXPLANATION_DESCRIPTION=`+ data.explanation_description + `" } .
					VALUES ?dataset_type_text { "`+ data.dataset_type + `" } .
					VALUES ?concur_text { "`+ data.concurrentness + `" } .
					VALUES ?scope_text { "`+ data.scope + `" } .
					VALUES ?port_text { "`+ data.portability + `" } .
					VALUES ?target_text { "`+ data.target + `" } .
          VALUES ?model_access_text { "`+ data.model_access + `" } .
					VALUES ?tech_text { "`+ data.name.replaceAll('/', '_') + "_technique" + `" } .
					VALUES ?exp_text { "`+ data.name.replaceAll('/', '_') + `" } . ` + presentations + `VALUES ?complexity_text { "` + data.complexity + `" } . 
					` + implementation + `VALUES ?explanation_type_class_text { "` + data.explanation_type[data.explanation_type.length - 1] + `" } . 
					` + ai_method + ai_task + `	
					BIND( IRI(?exp_tech_type_text) as ?explainability_technique) .
					BIND( IRI(?dataset_type_text) as ?datasetType) .
					BIND( IRI(?concur_text) as ?concurrentness) .
					BIND( IRI(?scope_text) as ?scope) .
					BIND( IRI(?port_text) as ?portability) .
					BIND( IRI(?target_text) as ?target_type) .
					BIND( IRI(CONCAT(?isee,?tech_text)) as ?technique) . 
					BIND( IRI(CONCAT(?isee,?exp_text)) as ?explainer) .
					BIND( IRI(?complexity_text) as ?complexity) .
					BIND( IRI(?aimethod_text) as ?aimethod) .
					BIND( IRI(?aitask_text) as ?aitask) .
          BIND( IRI(?model_access_text) as ?model_access) .
          BIND( `+ data.needs_training_data + ` as ?training_data) .
					BIND( IRI(?explanation_type_class_text) as ?explanation_type_class) . 
					` + presentations_bind + implementation_bind + ai_method_bind + ai_task_bind + `					
				}	
				`;

      console.log("query: ", query);

      var dataquery = qs.stringify({
        'update': query
      });

      var config = {
        method: 'post',
        url: BASE_URL_EXPLAINERS + 'update',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: dataquery
      };

      return axios(config)
        .then(function (response) {
          res.status(200).json({ response: response.data });
        })
        .catch(function (error) {
          console.log("error - inner: ", error)
          res.status(500).json({ error: error });
        });

    } catch (error) {
      return { message: "SPARQL SERVER QUERY ERROR - Outer", error: error };
    }
  }

}

module.exports.anyUpdateAdmin = async (req, res) => {

  if (req.body.ISEE_ADMIN_KEY != process.env.ISEE_ADMIN_KEY) {
    console.log("Unauth access");
    res.status(400).json({ message: "Unauthorised Access!" });
    return;
  } else {
    try {
      const query = req.body.query;
      console.log(query);

      var data = qs.stringify({
        'update': query
      });
      var config = {
        method: 'post',
        url: BASE_URL_EXPLAINERS + 'update',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
      };

      return axios(config)
        .then(function (response) {
          console.log(response.data)
          res.status(200).json({ response: response.data });
        })
        .catch(function (error) {
          console.log("error - inner: ", error)
          res.status(500).json({ error: error });

        });

    } catch (error) {
      return { message: "SPARQL SERVER QUERY ERROR - Outer", error: error };
    }
  }


}


module.exports.delete = async (req, res) => {

  if (req.body.ISEE_ADMIN_KEY != process.env.ISEE_ADMIN_KEY) {
    console.log("Unauth access");
    res.status(400).json({ message: "Unauthorised Access!" });
    return;
  }
  else {
    try {
      const explainer = req.body.data.id;
      console.log("Deleting Explainer " + explainer);

      const query_one = `
      prefix exp: <http://www.w3id.org/iSeeOnto/explainer#> 
      prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      prefix owl: <http://www.w3.org/2002/07/owl#>
      prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      prefix xsd: <http://www.w3.org/2001/XMLSchema#>
      
      DELETE
      WHERE {
        ?t rdfs:label "`+ explainer.replaceAll('/', '_') + `"^^xsd:string ;
              ?p ?o .
      }
      `;
      console.log(query_one);
      var data = qs.stringify({
        'update': query_one
      });
      var config = {
        method: 'post',
        url: BASE_URL_EXPLAINERS + 'update',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
      };

      
      const response_one = await axios(config);
      console.log(response_one);

      const query_two = `
      prefix exp: <http://www.w3id.org/iSeeOnto/explainer#> 
      prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      prefix owl: <http://www.w3.org/2002/07/owl#>
      prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
      prefix xsd: <http://www.w3.org/2001/XMLSchema#>
      
      DELETE
      WHERE {
        ?t rdfs:label "`+ explainer.replaceAll('/', '_') + "_technique"+`"^^xsd:string ;
              ?p ?o .
      }
      `;

      console.log(query_two);

      var data = qs.stringify({
        'update': query
      });
      var config = {
        method: 'post',
        url: BASE_URL_EXPLAINERS + 'update',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
      };

      
      const response_two = await axios(config);

      console.log(response_two.data);
      res.status(200).json({ response: response_two.data });

      // return axios(config)
      //   .then(function (response) {
      //     console.log(response);
      //     var all_values = response.data.results.bindings;
      //     console.log(all_values);
      //     var list_keyed = {}
      //     all_values.forEach(single => {
      //       if (!list_keyed[single.class.value]) {
      //         list_keyed[single.class.value] = []
      //       }
      //       list_keyed[single.class.value].push(single)
      //     });

      //     var data = []
      //     for (let instance in list_keyed) {
      //       // Per Instance
      //       var vals = {
      //         key: "",
      //         name: "",
      //         explainer_description: "",
      //         technique: "",
      //         dataset_type: "",
      //         explanation_type: "",
      //         explanation_description: "",
      //         concurrentness: "",
      //         portability: "",
      //         scope: "",
      //         target: "",
      //         presentations: [],
      //         computational_complexity: "",
      //         ai_methods: [],
      //         ai_tasks: [],
      //         implementation: [],
      //         metadata: "",
      //         model_access: "",
      //         needs_training_data: false
      //       }
      //       vals.key = v4();

      //       list_keyed[instance].forEach(p => {
      //         // Per Property
      //         // Name
      //         if (p.property.value == "http://www.w3.org/2000/01/rdf-schema#label") {
      //           var name = p.value.value.replace('_', '/').replace('_', '/');
      //           if (!name.includes('technique')) {
      //             vals.name = name;
      //           }
      //         }

      //         // Description
      //         if (p.property.value == "http://www.w3.org/2000/01/rdf-schema#comment") {
      //           var description = p.value.value;
      //           if (description.includes('EXPLAINER_DESCRIPTION')) {
      //             vals.explainer_description = description.substring(description.indexOf('=') + 1);
      //           }
      //         }

      //         // ExplainabilityTechnique
      //         if (p.property.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
      //           if (!p.value.value.includes('NamedIndividual')) {
      //             vals.technique = p.value.value;
      //           }
      //         }

      //         // Dataset Type
      //         if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#isCompatibleWithFeatureTypes") {
      //           vals.dataset_type = p.value.value;
      //         }

      //         // Explanation Type
      //         if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#hasOutputType") {
      //           vals.explanation_type = p.value.value;
      //         }

      //         // Explanation Description
      //         if (p.property.value == "http://www.w3.org/2000/01/rdf-schema#comment") {
      //           var description = p.value.value;
      //           if (description.includes('EXPLANATION_DESCRIPTION')) {
      //             vals.explanation_description = description.substring(description.indexOf('=') + 1);
      //           }
      //         }

      //         // Explainer Concurrentness
      //         if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#hasConcurrentness") {
      //           vals.concurrentness = p.value.value;
      //         }

      //         // Explainer Portability
      //         if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#hasPortability") {
      //           vals.portability = p.value.value;
      //         }

      //         // Explanation Scope
      //         if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#hasExplanationScope") {
      //           vals.scope = p.value.value;
      //         }

      //         // Explanation Target
      //         if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#targetType") {
      //           vals.target = p.value.value;
      //         }

      //         // Presentation Format
      //         if (p.property.value == "https://purl.org/heals/eo#hasPresentation") {
      //           vals.presentations.push(p.value.value)
      //         }

      //         // Computational Complexity
      //         if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#hasComplexity") {
      //           vals.computational_complexity = p.value.value;
      //         }

      //         // Applicable AI Methods
      //         if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#hasApplicableMethodType") {
      //           vals.ai_methods.push(p.value.value)
      //         }

      //         // Applicable AI Tasks
      //         if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#applicableProblemType") {
      //           vals.ai_tasks.push(p.value.value)
      //         }
      //         // Implementation Framework	
      //         if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#hasBackend") {
      //           vals.implementation.push(p.value.value)
      //         }

      //         // Needs Training Data
      //         if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#needs_training_data") {
      //           vals.needs_training_data = p.value.value;
      //         }

      //         // Model Access
      //         if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#has_model_access") {
      //           vals.model_access = p.value.value;
      //         }

      //         // Metadata
      //         if (p.property.value == "http://www.w3.org/2000/01/rdf-schema#comment") {
      //           var metadata = p.value.value;
      //           if (metadata.includes('META_DESCRIPTION')) {
      //             vals.metadata = JSON.stringify(metadata.substring(metadata.indexOf('=') + 1));
      //           }
      //         }

      //       })
      //       data.push(vals)
      //     }
      //     console.log(data);
      //     return data;

      //   })
      //   .catch(function (error) {
      //     console.log("error - inner: ", error)

      //     return { message: "SPARQL SERVER QUERY ERROR - Inner", error: error.response ? error.response.data : error };
      //   });

    } catch (error) {
      return { message: "SPARQL SERVER QUERY ERROR - Outer", error: error };
    }
  }


}