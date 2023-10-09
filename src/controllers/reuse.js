
const util = require("./util");
const queries = require("./queries");
const explainers = require("./explainers");

module.exports.reuseSupport = async (req, res) => {
    try {
        const explainer_list = getQueryexplainers();
        const ontology = queries.getExplainerFields();
        const ontology_flat = queries.getExplainerFieldsFlat();
        const explainers_extended = util.expandByOntology(explainer_list, ontology);
        const sim_matrix = util.rebuildSimilarity(explainers_extended);
        res.status(200).json(
            {
                "explainer_props": explainer_list,
                "explainer_props_extended": explainers_extended,
                "similarities": sim_matrix,
                "ontology_props": ontology_flat
            });
    } catch (error) {
        res.status(500).json({ message: error });
    }
};

module.exports.explainerFieldsFiltered = async (req, res) => {
    try {
        const explainer_props = explainers.list();
        const keep = extractProps(explainer_props);
        const result = queries.getExplainerFieldsFiltered(keep);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error });
    }
};

function extractProps(explainer_props){
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
        Implementation_Framework: []
    };
    for (const i in explainer_props){
        e = explainer_props[i];
        propertiesToPush.forEach(property => output[property].push(e[property]));
        output.ExplainabilityTechnique.push(e.technique);
        output.DatasetType.push(e.dataset_type);
        output.Explanation.push(e.explanation_type);
        output.Concurrentness.push(e.concurrentness);
        output.Scope.push(e.scope);
        output.Portability.push(e.portability);
        output.Target.push(e.target);
        output.InformationContentEntity.push(...e.presentations);
        output.ComputationalComplexity.push(e.computational_complexity);
        output.AIMethod.push(...e.ai_methods);
        output.AITask.push(...e.ai_tasks);
        output.Implementation_Framework.push(...e.implementation);
    }
}