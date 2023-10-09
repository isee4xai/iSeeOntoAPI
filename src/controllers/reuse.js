
const util = require("./util");
const queries = require("./queries");
const explainers = require("./explainers");

module.exports.reuseSupport = async (req, res) => {
    try {
        const explainer_props = explainers.list();
        const ontology = queries.getExplainerFields();
        const ontology_flat = queries.getExplainerFieldsFlat();
        const explainer_props_extended = util.expandByOntology(explainer_props, ontology);
        const sim_matrix = util.rebuildSimilarity(explainer_props_extended);
        res.status(200).json(
            {
                "explainer_props": explainer_props,
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
        const ontology = queries.getExplainerFields();
        const explainer_props_extended = util.expandByOntology(explainer_props, ontology);
        const keep = extractProps(explainer_props_extended);
        const result = queries.getExplainerFieldsFiltered(keep);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error });
    }
};

function extractProps(e_props_extended){
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
    for (const i in e_props_extended){
        e_extended = e_props_extended[i];
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
}