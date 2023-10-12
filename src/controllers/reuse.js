
const UtilService = require("../services/util");

module.exports.reuseSupport = async (req, res) => {
    try {
        const result = UtilService.reuseSupport();
        console.log("controller", result);
        return result;
    } catch (error) {
        res.status(500).json({ message: error });
    }
};

module.exports.explainersExtended = async (req, res) => {
    try {
        const result = await UtilService.explainerListExtended();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error });
    }
};

module.exports.explainerFieldsFiltered = async (req, res) => {
    try {
        const result = UtilService.explainerFieldsFiltered();
        console.log("controller", result);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error });
    }
};
