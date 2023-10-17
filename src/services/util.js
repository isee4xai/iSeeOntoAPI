const qs = require('qs');
const axios = require('axios');
const { v4 } = require('uuid');

const Node = require("./node");

require('dotenv').config();

const BASE_ONTO_URL = process.env.SPAQRL_ENDPOINT;
const ontoURL = BASE_ONTO_URL + 'sparql'
const BASE_EXPLAINERS_URL = process.env.SPAQRL_ENDPOINT_EXPLAINERS;
const explainersURL = BASE_EXPLAINERS_URL + 'sparql'

const SHARED_KEYS = { AI_TASK: 'https://purl.org/heals/eo#AITask', AI_METHOD: 'https://purl.org/heals/eo#ArtificialIntelligenceMethod' }
module.exports = class UtilService {
    static MEASURES = ['common_attributes', 'weighted_ca', 'cosine', 'depth', 'detail'];

    static SIMPLE_PROPERTIES = ['dataset_type', 'concurrentness', 'scope', 'portability', 'target', 'computational_complexity']; //add model access and need data here
    static COMPLEX_PROPERTIES = ['technique', 'explanation_type'];
    static SIMPLE_MULTI_PROPERTIES = ['implementation'];
    static COMPLEX_MULTI_PROPERTIES = ['presentations', 'ai_tasks', 'ai_methods'];

    static PROP_WEIGHTS = {
        'technique': 0.8, 'dataset_type': 1, 'concurrentness': 0.7, 'scope': 0.7, 'portability': 1,
        'target': 1, 'presentations': 0.5, 'explanation_type': 0.6, 'computational_complexity': 0.1, 'ai_methods': 1,
        'ai_tasks': 1, 'implementation': 0.9, 'metadata': 1
    };

    static WEIGHTS_TOTAL = 10.2999;

    /*
    only tested for depth
    */
    static rebuildSimilarity(explainer_list_expanded) {
        let matrix = {};
        for (const i in explainer_list_expanded) {
            let row = {};
            for (const j in explainer_list_expanded) {
                const explainer_i = explainer_list_expanded[i];
                const explainer_j = explainer_list_expanded[j];
                const sim = UtilService.similarityMeasure(explainer_i, explainer_j, UtilService.MEASURES[3]);
                row[explainer_list_expanded[j]["name"]] = sim;
            }
            matrix[explainer_list_expanded[i]["name"]] = row;
        }
        return matrix;
    }

    static expandByOntology(e_list, ontology) {

        const expanded_list = JSON.parse(JSON.stringify(e_list));
        const technique_parents = UtilService.populateParents(ontology["ExplainabilityTechnique"]["children"]);
        const explanation_type_parents = UtilService.populateParents(ontology["Explanation"]["children"]);
        const presentation_parents = UtilService.populateParents(ontology["InformationContentEntity"]["children"]);
        const ai_method_parents = UtilService.populateParents(ontology["AIMethod"]["children"]);
        const ai_task_parents = UtilService.populateParents(ontology["AITask"]["children"]);

        for (const i in expanded_list) {
            let e = expanded_list[i];
            e["technique"] = technique_parents[e["technique"]];
            e["explanation_type"] = explanation_type_parents[e["explanation_type"]];
            e["presentations"] = e["presentations"].map((x) => presentation_parents[x]);
            e["ai_methods"] = e["ai_methods"].map((x) => ai_method_parents[x]);
            e["ai_tasks"] = e["ai_tasks"].map((x) => ai_task_parents[x]);
            expanded_list[i] = e;
        }
        return expanded_list;
    }

    static populateParents(dataArray, parentList = []) {
        const result = {};

        dataArray.forEach((data) => {
            const currentParentList = parentList.slice();
            if (data.key) {
                currentParentList.push(data.key);
                result[data.key] = currentParentList;

                if (data.children && data.children.length > 0) {
                    Object.assign(result, UtilService.populateParents(data.children, currentParentList));
                }
            }
        });

        return result;
    }

    static similarityMeasure(e1, e2, measure) {
        let sim;
        switch (measure) {
            case 'common_attributes':
                sim = UtilService.applyCommonAttributes(e1, e2);
                break;
            case 'weighted_ca':
                sim = UtilService.applyWeightedCommonAttributes(e1, e2);
                break;
            case 'cosine':
                sim = UtilService.applyCosine(e1, e2);
                break;
            case 'depth':
                sim = UtilService.applyDepth(e1, e2);
                break;
            case 'detail':
                sim = UtilService.applyDetail(e1, e2);
                break;
            default:
                sim = 0.0;
                break;
        }
        return sim;
    }

    static applyCommonAttributes(e1, e2) {

        if (e1['name'] == e2['name']) {
            return 1
        }
        else if (e1['dataset_type'] !== e2['dataset_type']) {
            return 0;
        }
        else if (e1['technique'] === e2['technique']) {
            return 0.9;
        }
        else {
            const keysToFilter = ['key', 'name']
            const keys = Object.keys(e1).filter((key) => !keysToFilter.includes(key));
            const count = Object.keys(keys).reduce((acc, k) => {
                if (e1[k] === e2[k]) {
                    return acc + 1;
                }
                return acc;
            }, 0);
            return count / keys.length;
        }
    }

    static applyWeightedCommonAttributes(e1, e2) {

        if (e1['name'] == e2['name']) {
            return 1
        }
        else if (e1['dataset_type'] !== e2['dataset_type']) {
            return 0;
        }
        else if (e1['technique'] === e2['technique']) {
            return 0.9;
        }
        else {
            const keysToFilter = ['key', 'name']
            const keys = Object.keys(e1).filter((key) => !keysToFilter.includes(key));
            const count = Object.keys(keys).reduce((acc, k) => {
                if (e1[k] === e2[k]) {
                    return acc + UtilService.PROP_WEIGHTS[k];
                }
                return acc;
            }, 0);
            return count / UtilService.WEIGHTS_TOTAL;
        }
    }

    static applyCosine(e1, e2) {
        return UtilService.applyMeasureParents(e1, e2, "cosine");
    }

    static applyDepth(e1, e2) {
        return UtilService.applyMeasureParents(e1, e2, "depth");
    }

    static applyDetail(e1, e2) {
        return UtilService.applyMeasureParents(e1, e2, "detail");
    }

    static applyMeasureParents(e1, e2, measure) {
        if (e1['name'] == e2['name']) {
            return 1
        }
        else if (e1['dataset_type'] !== e2['dataset_type']) {
            return 0;
        }
        else if (e1['technique'] === e2['technique']) {
            return 0.9;
        }
        else {
            const keysToFilter = ['key', 'name']
            const keys = Object.keys(e1).filter((key) => !keysToFilter.includes(key));
            let count = 0;
            for (const k in keys) {
                if (UtilService.SIMPLE_PROPERTIES.includes(keys[k])) {
                    if (e1[keys[k]] === e2[keys[k]]) {
                        count = count + UtilService.PROP_WEIGHTS[keys[k]];
                    }
                }
                else if (UtilService.COMPLEX_PROPERTIES.includes(keys[k])) {
                    count = count + UtilService.ontologyWeight(keys[k], e1[keys[k]], e2[keys[k]], measure);
                }
                else if (UtilService.SIMPLE_MULTI_PROPERTIES.includes(keys[k])) {
                    if (e1[keys[k]].includes('http://www.w3id.org/iSeeOnto/explainer#Any') || e2[keys[k]].includes('http://www.w3id.org/iSeeOnto/explainer#Any')) {
                        count = count + UtilService.PROP_WEIGHTS[keys[k]];
                    }
                    else {
                        count = count + (UtilService.PROP_WEIGHTS[keys[k]] * UtilService.ontologyWeightCosine(e1[keys[k]], e2[keys[k]]));
                    }
                }
                else if (UtilService.COMPLEX_MULTI_PROPERTIES.includes(keys[k])) {
                    let weightComplex = 0;
                    let firstWeight = true;
                    const cosine_weight = UtilService.ontologyWeightCosine(e1[keys[k]], e2[keys[k]]);
                    for (const p in e1[keys[k]]) {
                        for (const q in e2[keys[k]]) {
                            const _weight = UtilService.ontologyWeight(keys[k], e1[keys[k]][p], e2[keys[k]][q], measure) * cosine_weight;
                            if (_weight > 0) {
                                if (firstWeight) {
                                    weightComplex = _weight;
                                    firstWeight = false;
                                } else {
                                    weightComplex *= _weight;
                                }
                            }
                        }
                    }
                    count = count + weightComplex;
                }
            }
            return count / UtilService.WEIGHTS_TOTAL;
        }
    }

    static ontologyWeight(prop, v1, v2, measure) {
        switch (measure) {
            case "cosine":
                return UtilService.PROP_WEIGHTS[prop] * UtilService.ontologyWeightCosine(v1, v2);
            case "depth":
                return UtilService.PROP_WEIGHTS[prop] * UtilService.ontologyWeightDepth(v1, v2);
            case "detail":
                return UtilService.PROP_WEIGHTS[prop] * UtilService.ontologyWeightDetail(v1, v2);
        }
    }

    static ontologyWeightCosine(v1, v2) {
        if (v1 === v2) {
            return 1
        }
        else {
            const shared = v1.filter((x) => v2.includes(x));
            const uniqueValues = new Set([...v1, ...v2]);
            return shared.length / uniqueValues.size;
        }
    }

    static ontologyWeightDepth(v1, v2) {
        if (v1 === v2) {
            return 1
        }
        else {
            const lcs = v1.filter((x) => v2.includes(x)).length;
            const denominator = Math.max(v1.length, v2.length);

            if (denominator === 0 || lcs === 0) {
                return 0;
            } else {
                return lcs / denominator;
            }
        }
    }

    static ontologyWeightDetail(v1, v2) {
        if (v1 === v2) {
            return 1
        }
        else {
            1 - (1 / (2 * (v1.length + v2.length)));
        }
    }

    static async explainerFields() {
        let output = {
            ExplainabilityTechnique: [],
            DatasetType: [],
            Explanation: [],
            Concurrentness: [],
            Scope: [],
            Portability: [],
            Target: [],
            InformationContentEntity: [],
            ComputationalComplexity: [],
            AIMethod: [],
            AITask: [],
            Implementation_Framework: [],
            ModelAccess: [],
            NeedsTrainingData: []
        }
        output.ExplainabilityTechnique = await UtilService.getQueryForClassesWithChildren('http://www.w3id.org/iSeeOnto/explainer#ExplainabilityTechnique');

        output.Explanation = await UtilService.getQueryForClassesWithChildren('http://linkedu.eu/dedalo/explanationPattern.owl#Explanation');

        output.DatasetType = await UtilService.getQueryForInstances('explainer', 'DatasetType');

        output.ExplainabilityTechnique = await UtilService.getQueryForClassesWithChildren('http://www.w3id.org/iSeeOnto/explainer#ExplainabilityTechnique');

        output.Concurrentness = await UtilService.getQueryForInstances('explainer', 'ExplainerConcurrentness');

        output.Scope = await UtilService.getQueryForInstances('explainer', 'ExplanationScope');

        output.Portability = await UtilService.getQueryForInstances('explainer', 'Portability');

        output.Target = await UtilService.getQueryForInstances('explainer', 'ExplanationTarget');

        output.ComputationalComplexity = await UtilService.getQueryForInstances('explainer', 'Time_Complexity');

        output.Implementation_Framework = await UtilService.getQueryForInstances('explainer', 'Implementation_Framework');

        output.ModelAccess = await UtilService.getQueryForInstances('explainer', 'Model_Access_Type');

        output.NeedsTrainingData = await UtilService.getQueryForInstances('explainer', 'needs_training_data');

        output.InformationContentEntity = await UtilService.getQueryForClassesWithChildren('http://semanticscience.org/resource/SIO_000015');

        output.AIMethod = await UtilService.getQueryForClassesWithChildren(SHARED_KEYS.AI_METHOD);

        output.AITask = await UtilService.getQueryForClassesWithChildren(SHARED_KEYS.AI_TASK);

        return output
    }

    static async explainerFieldsWithFilter(filter) {
        let output = {
            ExplainabilityTechnique: [],
            DatasetType: [],
            Explanation: [],
            Concurrentness: [],
            Scope: [],
            Portability: [],
            Target: [],
            InformationContentEntity: [],
            ComputationalComplexity: [],
            AIMethod: [],
            AITask: [],
            Implementation_Framework: [],
            ModelAccess: [],
            NeedsTrainingData: []
        }
        output.ExplainabilityTechnique = await UtilService.getQueryForClassesFilterWithChildren('http://www.w3id.org/iSeeOnto/explainer#ExplainabilityTechnique', filter.ExplainabilityTechnique);

        output.Explanation = await UtilService.getQueryForClassesFilterWithChildren('http://linkedu.eu/dedalo/explanationPattern.owl#Explanation', filter.Explanation);

        output.DatasetType = await UtilService.getQueryFilterForInstances('explainer', 'DatasetType', filter.DatasetType);

        output.ExplainabilityTechnique = await UtilService.getQueryForClassesFilterWithChildren('http://www.w3id.org/iSeeOnto/explainer#ExplainabilityTechnique', filter.ExplainabilityTechnique);

        output.Concurrentness = await UtilService.getQueryFilterForInstances('explainer', 'ExplainerConcurrentness', filter.Concurrentness);

        output.Scope = await UtilService.getQueryFilterForInstances('explainer', 'ExplanationScope', filter.Scope);

        output.Portability = await UtilService.getQueryFilterForInstances('explainer', 'Portability', filter.Portability);

        output.Target = await UtilService.getQueryFilterForInstances('explainer', 'ExplanationTarget', filter.Target);

        output.ComputationalComplexity = await UtilService.getQueryFilterForInstances('explainer', 'Time_Complexity', filter.ComputationalComplexity);

        output.Implementation_Framework = await UtilService.getQueryFilterForInstances('explainer', 'Implementation_Framework', filter.Implementation_Framework);

        output.ModelAccess = await UtilService.getQueryFilterForInstances('explainer', 'Model_Access_Type', filter.ModelAccess);

        output.NeedsTrainingData = await UtilService.getQueryFilterForInstances('explainer', 'needs_training_data', filter.NeedsTrainingData);

        output.InformationContentEntity = await UtilService.getQueryForClassesFilterWithChildren('http://semanticscience.org/resource/SIO_000015', filter.InformationContentEntity);

        output.AIMethod = await UtilService.getQueryForClassesFilterWithChildren(SHARED_KEYS.AI_METHOD, filter.AIMethod);

        output.AITask = await UtilService.getQueryForClassesFilterWithChildren(SHARED_KEYS.AI_TASK, filter.AITask);

        return output
    }

    static async explainerFieldsFlat() {
        let output = {
            ExplainabilityTechnique: [],
            DatasetType: [],
            Explanation: [],
            Concurrentness: [],
            Scope: [],
            Portability: [],
            Target: [],
            InformationContentEntity: [],
            ComputationalComplexity: [],
            AIMethod: [],
            AITask: [],
            Implementation_Framework: [],
            ModelAccess: [],
            NeedsTrainingData: []
        }
        output.ExplainabilityTechnique = await UtilService.getQueryForClassesWithChildrenFlat('http://www.w3id.org/iSeeOnto/explainer#ExplainabilityTechnique');

        output.Explanation = await UtilService.getQueryForClassesWithChildrenFlat('http://linkedu.eu/dedalo/explanationPattern.owl#Explanation');

        output.DatasetType = await UtilService.getQueryForInstancesFlat('explainer', 'DatasetType');

        output.ExplainabilityTechnique = await UtilService.getQueryForClassesWithChildrenFlat('http://www.w3id.org/iSeeOnto/explainer#ExplainabilityTechnique');

        output.Concurrentness = await UtilService.getQueryForInstancesFlat('explainer', 'ExplainerConcurrentness');

        output.Scope = await UtilService.getQueryForInstancesFlat('explainer', 'ExplanationScope');

        output.Portability = await UtilService.getQueryForInstancesFlat('explainer', 'Portability');

        output.Target = await UtilService.getQueryForInstancesFlat('explainer', 'ExplanationTarget');

        output.ComputationalComplexity = await UtilService.getQueryForInstancesFlat('explainer', 'Time_Complexity');

        output.Implementation_Framework = await UtilService.getQueryForInstancesFlat('explainer', 'Implementation_Framework');

        output.ModelAccess = await UtilService.getQueryForInstancesFlat('explainer', 'Model_Access_Type');

        output.NeedsTrainingData = await UtilService.getQueryForInstancesFlat('explainer', 'needs_training_data');

        output.InformationContentEntity = await UtilService.getQueryForClassesWithChildrenFlat('http://semanticscience.org/resource/SIO_000015');

        output.AIMethod = await UtilService.getQueryForClassesWithChildrenFlat(SHARED_KEYS.AI_METHOD);

        output.AITask = await UtilService.getQueryForClassesWithChildrenFlat(SHARED_KEYS.AI_TASK);

        return output
    }

    static async getQueryForInstances(ontology, parent) {
        try {
            const query = `
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          
          SELECT distinct ?class ?label
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
                url: explainersURL,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: data
            };

            return axios(config)
                .then(function (response) {
                    const parsed = UtilService.parseClasses(response);
                    return parsed;
                })
                .catch(function (error) {
                    console.log("error - inner: ", error)

                    return { message: "SPARQL SERVER QUERY ERROR - Inner", error: error.response ? error.response.data : error };
                });

        } catch (error) {
            return { message: "SPARQL SERVER QUERY ERROR - Outer", error: error };
        }

    }

    static parseClasses(data) {
        var parse = [];
        const results = data.data.results.bindings;
        results.forEach(c => {
            parse.push({ "key": c.class.value, "label": c.label.value })
        });

        return parse;
    }

    static async getQueryForClassesWithChildren(rootKey) {
        try {
            const query = `
          prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          SELECT distinct ?class ?label ?parent
          WHERE {
              ?class rdfs:label ?label .
              ?class rdfs:subClassOf* <`+ rootKey + `>.
                ?class rdfs:subClassOf ?parent
          }
          order by ?class`;

            var data = qs.stringify({
                'query': query
            });
            var config = {
                method: 'post',
                url: ontoURL,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: data
            };

            return axios(config)
                .then(function (response) {
                    const parsed = UtilService.parseWithChildren(response, rootKey);
                    return parsed;
                })
                .catch(function (error) {
                    console.log("error - inner: ", error)
                    return { message: "SPARQL SERVER QUERY ERROR - Inner", error: error.response ? error.response.data : error };
                });

        } catch (error) {
            return { message: "SPARQL SERVER QUERY ERROR - Outer", error: error };
        }

    }

    static parseWithChildren(data, rootKey) {
        var parse = [];
        const results = data.data.results.bindings;
        results.forEach(c => {
            parse.push({ "key": c.class.value, "label": c.label.value, "parent": c.parent.value })
        });

        var nodes = {}
        var root = new Node(rootKey, rootKey, rootKey)
        nodes[rootKey] = root;

        parse.forEach(c => {
            var n = new Node(c.key, c.label, c.parent)
            nodes[c.key] = n
        })

        parse.forEach(c => {
            var temp = nodes[c.parent];
            // Only if a parent exists add it
            if (temp) {
                temp.addChild(nodes[c.key])
            }
        })

        return nodes[rootKey]
    }

    static async getQueryFilterForInstances(ontology, parent, filter) {

        try {
            const query = `
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          
          SELECT distinct ?class ?label
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
                url: ontoURL,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: data
            };

            return axios(config)
                .then(function (response) {
                    const parsed = UtilService.parseFilterClasses(response, filter);
                    return parsed;
                })
                .catch(function (error) {
                    console.log("error - inner: ", error)

                    return { message: "SPARQL SERVER QUERY ERROR - Inner", error: error.response ? error.response.data : error };
                });

        } catch (error) {
            return { message: "SPARQL SERVER QUERY ERROR - Outer", error: error };
        }

    }

    static parseFilterClasses(data, filter) {
        var parse = [];
        const results = data.data.results.bindings;
        results.forEach(c => {
            parse.push({ "key": c.class.value, "label": c.label.value })
        });

        // Filter the parse array
        if (filter.length > 0) {
            parse = parse.filter(obj => filter.includes(obj.key));
        }

        return parse;
    }

    static async getQueryForClassesFilterWithChildren(rootKey, filter) {
        try {
            const query = `
          prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          SELECT distinct ?class ?label ?parent
          WHERE {
              ?class rdfs:label ?label .
              ?class rdfs:subClassOf* <`+ rootKey + `>.
                ?class rdfs:subClassOf ?parent
          }
          order by ?class`;

            var data = qs.stringify({
                'query': query
            });
            var config = {
                method: 'post',
                url: ontoURL,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: data
            };

            return axios(config)
                .then(function (response) {
                    const parsed = UtilService.parseFilterWithChildren(response, rootKey, filter);
                    return parsed;
                })
                .catch(function (error) {
                    console.log("error - inner: ", error)
                    return { message: "SPARQL SERVER QUERY ERROR - Inner", error: error.response ? error.response.data : error };
                });

        } catch (error) {
            return { message: "SPARQL SERVER QUERY ERROR - Outer", error: error };
        }

    }

    static parseFilterWithChildren(data, rootKey, filter) {
        var parse = [];
        const results = data.data.results.bindings;
        results.forEach(c => {
            parse.push({ "key": c.class.value, "label": c.label.value, "parent": c.parent.value })
        });

        // Filter the parse array
        if (filter.length > 0) {
            parse = parse.filter(obj => filter.includes(obj.key));
        }

        var nodes = {}
        var root = new Node(rootKey, rootKey, rootKey)
        nodes[rootKey] = root;

        parse.forEach(c => {
            var n = new Node(c.key, c.label, c.parent)
            nodes[c.key] = n
        })

        parse.forEach(c => {
            var temp = nodes[c.parent];
            // Only if a parent exists add it
            if (temp) {
                temp.addChild(nodes[c.key])
            }
        })

        return nodes[rootKey]
    }

    static async getQueryForInstancesFlat(ontology, parent) {

        try {
            const query = `
          PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          
          SELECT distinct ?class ?label
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
                url: ontoURL,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: data
            };

            return axios(config)
                .then(function (response) {
                    const parsed = UtilService.parseClassesFlat(response);
                    return parsed;
                })
                .catch(function (error) {
                    console.log("error - inner: ", error)

                    return { message: "SPARQL SERVER QUERY ERROR - Inner", error: error.response ? error.response.data : error };
                });

        } catch (error) {
            return { message: "SPARQL SERVER QUERY ERROR - Outer", error: error };
        }

    }

    static async getQueryForClassesWithChildrenFlat(rootKey) {
        try {
            const query = `
          prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          SELECT distinct ?class ?label ?parent
          WHERE {
              ?class rdfs:label ?label .
              ?class rdfs:subClassOf* <`+ rootKey + `>.
                ?class rdfs:subClassOf ?parent
          }
          order by ?class`;

            var data = qs.stringify({
                'query': query
            });
            var config = {
                method: 'post',
                url: ontoURL,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: data
            };

            return axios(config)
                .then(function (response) {
                    const parsed = UtilService.parseWithChildrenFlat(response, rootKey);
                    return parsed;
                })
                .catch(function (error) {
                    console.log("error - inner: ", error)
                    return { message: "SPARQL SERVER QUERY ERROR - Inner", error: error.response ? error.response.data : error };
                });

        } catch (error) {
            return { message: "SPARQL SERVER QUERY ERROR - Outer", error: error };
        }

    }

    static parseWithChildrenFlat(data, rootKey) {
        var parse = {};
        const results = data.data.results.bindings;
        results.forEach(c => {
            parse[c.class.value] = c.label.value
        });

        return parse
    }

    static parseClassesFlat(data) {
        var parse = {};
        const results = data.data.results.bindings;
        results.forEach(c => {
            parse[c.class.value] = c.label.value
        });
        return parse;
    }

    static async explainerList() {

        try {
            const query = `
          PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
          prefix exp: <http://www.w3id.org/iSeeOnto/explainer#> 
          
          SELECT *
          WHERE {
              ?class a <http://www.w3id.org/iSeeOnto/explainer#Explainer>;
              exp:utilises ?utilises.
              {?class ?property ?value}
              UNION 
              {
              ?utilises ?property ?value
              }
              # {?value rdfs:label ?label} 
          }
          `;

            var data = qs.stringify({
                'query': query
            });
            var config = {
                method: 'post',
                url: explainersURL,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: data
            };

            return axios(config)
                .then(function (response) {

                    var all_values = response.data.results.bindings;
                    var list_keyed = {}
                    all_values.forEach(single => {
                        if (!list_keyed[single.class.value]) {
                            list_keyed[single.class.value] = []
                        }
                        list_keyed[single.class.value].push(single)
                    });

                    var data = []
                    for (let instance in list_keyed) {
                        // Per Instance
                        var vals = {
                            key: "",
                            name: "",
                            explainer_description: "",
                            technique: "",
                            dataset_type: "",
                            explanation_type: "",
                            explanation_description: "",
                            concurrentness: "",
                            portability: "",
                            scope: "",
                            target: "",
                            presentations: [],
                            computational_complexity: "",
                            ai_methods: [],
                            ai_tasks: [],
                            implementation: [],
                            metadata: "",
                            model_access: "",
                            needs_training_data: false
                        }
                        vals.key = v4();

                        list_keyed[instance].forEach(p => {
                            // Per Property
                            // Name
                            if (p.property.value == "http://www.w3.org/2000/01/rdf-schema#label") {
                                var name = p.value.value.replace('_', '/').replace('_', '/');
                                if (!name.includes('technique')) {
                                    vals.name = name;
                                }
                            }

                            // Description
                            if (p.property.value == "http://www.w3.org/2000/01/rdf-schema#comment") {
                                var description = p.value.value;
                                if (description.includes('EXPLAINER_DESCRIPTION')) {
                                    vals.explainer_description = description.substring(description.indexOf('=') + 1);
                                }
                            }

                            // ExplainabilityTechnique
                            if (p.property.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                                if (!p.value.value.includes('NamedIndividual')) {
                                    vals.technique = p.value.value;
                                }
                            }

                            // Dataset Type
                            if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#isCompatibleWithFeatureTypes") {
                                vals.dataset_type = p.value.value;
                            }

                            // Explanation Type
                            if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#hasOutputType") {
                                vals.explanation_type = p.value.value;
                            }

                            // Explanation Description
                            if (p.property.value == "http://www.w3.org/2000/01/rdf-schema#comment") {
                                var description = p.value.value;
                                if (description.includes('EXPLANATION_DESCRIPTION')) {
                                    vals.explanation_description = description.substring(description.indexOf('=') + 1);
                                }
                            }

                            // Explainer Concurrentness
                            if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#hasConcurrentness") {
                                vals.concurrentness = p.value.value;
                            }

                            // Explainer Portability
                            if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#hasPortability") {
                                vals.portability = p.value.value;
                            }

                            // Explanation Scope
                            if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#hasExplanationScope") {
                                vals.scope = p.value.value;
                            }

                            // Explanation Target
                            if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#targetType") {
                                vals.target = p.value.value;
                            }

                            // Presentation Format
                            if (p.property.value == "https://purl.org/heals/eo#hasPresentation") {
                                vals.presentations.push(p.value.value)
                            }

                            // Computational Complexity
                            if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#hasComplexity") {
                                vals.computational_complexity = p.value.value;
                            }

                            // Applicable AI Methods
                            if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#hasApplicableMethodType") {
                                vals.ai_methods.push(p.value.value)
                            }

                            // Applicable AI Tasks
                            if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#applicableProblemType") {
                                vals.ai_tasks.push(p.value.value)
                            }
                            // Implementation Framework	
                            if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#hasBackend") {
                                vals.implementation.push(p.value.value)
                            }

                            // Needs Training Data
                            if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#needsTrainingData") {
                                console.log("needsTrainingData", p);
                                vals.needs_training_data = p.value.value;
                            }

                            // Model Access
                            if (p.property.value == "http://www.w3id.org/iSeeOnto/explainer#modelAccessType") {
                                vals.model_access = p.value.value;
                            }

                            // Metadata
                            if (p.property.value == "http://www.w3.org/2000/01/rdf-schema#comment") {
                                var metadata = p.value.value;
                                if (metadata.includes('META_DESCRIPTION')) {
                                    vals.metadata = JSON.stringify(metadata.substring(metadata.indexOf('=') + 1));
                                }
                            }

                        })
                        data.push(vals)
                    }
                    return data;

                })
                .catch(function (error) {
                    console.log("error - inner: ", error)

                    return { message: "SPARQL SERVER QUERY ERROR - Inner", error: error.response ? error.response.data : error };
                });

        } catch (error) {
            return { message: "SPARQL SERVER QUERY ERROR - Outer", error: error };
        }

    }

    static async explainerListExtended() {
        try {
            const explainer_props = await UtilService.explainerList();
            const ontology = await UtilService.explainerFields();
            const result = UtilService.expandByOntology(explainer_props, ontology);
            return result;
        } catch (error) {
            console.log(error);
            return { message: "SPARQL SERVER QUERY ERROR - Outer", error: error };
        }
    }

    static async explainerFieldsFiltered() {
        try {
            const explainer_props_extended = await UtilService.explainerListExtended();
            const keep = UtilService.extractProps(explainer_props_extended);
            const result = await UtilService.explainerFieldsWithFilter(keep);
            return result;
        } catch (error) {
            console.log(error);
            return { message: "SPARQL SERVER QUERY ERROR - Outer", error: error };
        }
    }

    static extractProps(e_props_extended) {
        let output = {
            ExplainabilityTechnique: [],
            DatasetType: [],
            Explanation: [],
            Concurrentness: [],
            Scope: [],
            Portability: [],
            Target: [],
            InformationContentEntity: [],
            ComputationalComplexity: [],
            AIMethod: [],
            AITask: [],
            Implementation_Framework: [],
            ModelAccess: [],
            NeedsTrainingData: []
        };
        for (const i in e_props_extended) {
            const e_extended = e_props_extended[i];
            output.ExplainabilityTechnique.push(...e_extended.technique);
            output.DatasetType.push(e_extended.dataset_type);
            output.Explanation.push(...e_extended.explanation_type);
            output.Concurrentness.push(e_extended.concurrentness);
            output.Scope.push(e_extended.scope);
            output.Portability.push(e_extended.portability);
            output.Target.push(e_extended.target);
            output.InformationContentEntity.push(...[].concat(...e_extended.presentations));
            output.ComputationalComplexity.push(e_extended.computational_complexity);
            output.AIMethod.push(...[].concat(...e_extended.ai_methods));
            output.AITask.push(...[].concat(...e_extended.ai_tasks));
            output.Implementation_Framework.push(...[].concat(...e_extended.implementation));
        }
        return output;
    }

    static async reuseSupport() {
        try {
            const ontology = await UtilService.explainerFields();
            const explainer_props = await UtilService.explainerList();
            const ontology_flat = await UtilService.explainerFieldsFlat();
            const explainer_props_extended = UtilService.expandByOntology(explainer_props, ontology);
            const sim_matrix = UtilService.rebuildSimilarity(explainer_props_extended);
            const result  = {
                "explainer_props": explainer_props,
                "explainer_props_extended": explainer_props_extended,
                "similarities": sim_matrix,
                "ontology_props": ontology_flat
            };
            return result;
        } catch (error) {
            console.log(error);
            return { message: "SPARQL SERVER QUERY ERROR - Outer", error: error };
        }
    }
}