const MEASURES = ['common_attributes', 'weighted_ca', 'cosine', 'depth', 'detail'];

const SIMPLE_PROPERTIES = ['dataset_type', 'concurrentness', 'scope', 'portability', 'target', 'computational_complexity'];
const COMPLEX_PROPERTIES = ['technique', 'explanation_type'];
const SIMPLE_MULTI_PROPERTIES = ['implementation'];
const COMPLEX_MULTI_PROPERTIES = ['presentations', 'ai_tasks', 'ai_methods'];

const PROP_WEIGHTS = {
    'technique': 0.8, 'dataset_type': 1, 'concurrentness': 0.7, 'scope': 0.7, 'portability': 1,
    'target': 1, 'presentations': 0.5, 'explanation_type': 0.6, 'computational_complexity': 0.1, 'ai_methods': 1,
    'ai_tasks': 1, 'implementation': 0.9, 'metadata': 1
}

const WEIGHTS_TOTAL = 10.2999;

/*
only tested for depth
*/
function rebuildSimilarity(explainer_list_expanded) {
    const matrix = {};
    for (const i in explainer_list_expanded) {
        const row = {};
        for (const j in explainer_list_expanded) {
            explainer_i = explainer_list_expanded[i];
            explainer_j = explainer_list_expanded[j];
            sim = similarityMeasure(explainer_i, explainer_j, MEASURES[3]);
            row[explainer_list_expanded[j]["name"]] = sim;
        }
        matrix[explainer_list_expanded[i]["name"]] = row;
    }
    return matrix;
}

function expandByOntology(e_list, ontology) {
    expanded_list = JSON.parse(JSON.stringify(e_list));
    const technique_parents = populateParents(ontology["ExplainabilityTechnique"]["children"]);
    const explanation_type_parents = populateParents(ontology["Explanation"]["children"]);
    const presentation_parents = populateParents(ontology["InformationContentEntity"]["children"]);
    const ai_method_parents = populateParents(ontology["AIMethod"]["children"]);
    const ai_task_parents = populateParents(ontology["AITask"]["children"]);

    for (const i in expanded_list) {
        e = expanded_list[i];
        e["technique"] = technique_parents[e["technique"]];
        e["explanation_type"] = explanation_type_parents[e["explanation_type"]];
        e["presentations"] = e["presentations"].map((x) => presentation_parents[x]);
        e["ai_methods"] = e["ai_methods"].map((x) => ai_method_parents[x]);
        e["ai_tasks"] = e["ai_tasks"].map((x) => ai_task_parents[x]);
    }
    return expanded_list;
}

function populateParents(dataArray, parentList = []) {
    const result = {};

    dataArray.forEach((data) => {
        const currentParentList = parentList.slice();
        if (data.key) {
            currentParentList.push(data.key);
            result[data.key] = currentParentList;

            if (data.children && data.children.length > 0) {
                Object.assign(result, populateParents(data.children, currentParentList));
            }
        }
    });

    return result;
}

function similarityMeasure(e1, e2, measure) {
    let sim;
    switch (measure) {
        case 'common_attributes':
            sim = applyCommonAttributes(e1, e2);
            break;
        case 'weighted_ca':
            sim = applyWeightedCommonAttributes(e1, e2);
            break;
        case 'cosine':
            sim = applyCosine(e1, e2);
            break;
        case 'depth':
            sim = applyDepth(e1, e2);
            break;
        case 'detail':
            sim = applyDetail(e1, e2);
            break;
        default:
            sim = 0.0;
            break;
    }
    return sim;
}

function applyCommonAttributes(e1, e2) {

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
        keysToFilter = ['key', 'name']
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

function applyWeightedCommonAttributes(e1, e2) {

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
        keysToFilter = ['key', 'name']
        const keys = Object.keys(e1).filter((key) => !keysToFilter.includes(key));
        const count = Object.keys(keys).reduce((acc, k) => {
            if (e1[k] === e2[k]) {
                return acc + PROP_WEIGHTS[k];
            }
            return acc;
        }, 0);
        return count / WEIGHTS_TOTAL;
    }
}

function applyCosine(e1, e2) {
    return applyMeasureParents(e1, e2, "cosine");
}

function applyDepth(e1, e2) {
    return applyMeasureParents(e1, e2, "depth");
}

function applyDetail(e1, e2) {
    return applyMeasureParents(e1, e2, "detail");
}

function applyMeasureParents(e1, e2, measure) {
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
        keysToFilter = ['key', 'name']
        const keys = Object.keys(e1).filter((key) => !keysToFilter.includes(key));
        let count = 0;
        for (const k in keys) {
            if (SIMPLE_PROPERTIES.includes(keys[k])) {
                if (e1[keys[k]] === e2[keys[k]]) {
                    count = count + PROP_WEIGHTS[keys[k]];
                }
            }
            else if (COMPLEX_PROPERTIES.includes(keys[k])) {
                count = count + ontologyWeight(keys[k], e1[keys[k]], e2[keys[k]], measure);
            }
            else if (SIMPLE_MULTI_PROPERTIES.includes(keys[k])) {
                if (e1[keys[k]].includes('http://www.w3id.org/iSeeOnto/explainer#Any') || e2[keys[k]].includes('http://www.w3id.org/iSeeOnto/explainer#Any')) {
                    count = count + PROP_WEIGHTS[keys[k]];
                }
                else {
                    count = count + (PROP_WEIGHTS[keys[k]] * ontologyWeightCosine(e1[keys[k]], e2[keys[k]]));
                }
            }
            else if (COMPLEX_MULTI_PROPERTIES.includes(keys[k])) {
                let weightComplex = 0;
                let firstWeight = true;
                const cosine_weight = ontologyWeightCosine(e1[keys[k]], e2[keys[k]]);
                for (const p in e1[keys[k]]) {
                    for (const q in e2[keys[k]]) {
                        _weight = ontologyWeight(keys[k], e1[keys[k]][p], e2[keys[k]][q], measure) * cosine_weight;
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
        return count / WEIGHTS_TOTAL;
    }
}

function ontologyWeight(prop, v1, v2, measure) {
    switch (measure) {
        case "cosine":
            return PROP_WEIGHTS[prop] * ontologyWeightCosine(v1, v2);
        case "depth":
            return PROP_WEIGHTS[prop] * ontologyWeightDepth(v1, v2);
        case "detail":
            return PROP_WEIGHTS[prop] * ontologyWeightDetail(v1, v2);
    }
}

function ontologyWeightCosine(v1, v2) {
    if (v1 === v2) {
        return 1
    }
    else {
        const shared = v1.filter((x) => v2.includes(x));
        const uniqueValues = new Set([...v1, ...v2]);
        return shared.length / uniqueValues.size;
    }
}

function ontologyWeightDepth(v1, v2) {
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

function ontologyWeightDetail(v1, v2) {
    if (v1 === v2) {
        return 1
    }
    else {
        1 - (1 / (2 * (v1.length + v2.length)));
    }
}

module.exports = {
    rebuildSimilarity, expandByOntology
};