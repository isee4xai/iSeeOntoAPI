// Required for subclasses based methods
module.exports = class Node {
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