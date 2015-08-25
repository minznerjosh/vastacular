'use strict';

/* jshint browser:true, browserify:true, node:false */

var map = Array.prototype.map;
var filter = Array.prototype.filter;
var reduce = Array.prototype.reduce;

var parser = new DOMParser();

function convertNode(node) {
    var hasChildren = node.childElementCount > 0;

    return {
        tag: node.tagName,
        value: hasChildren ? null: node.textContent,
        attributes: reduce.call(node.attributes, function(result, attribute) {
            result[attribute.name] = attribute.value;
            return result;
        }, {}),

        find: function find(selector) {
            return convertNodes(node.querySelectorAll(selector));
        },
        children: function children() {
            return filter.call(node.childNodes, function isElement(node) {
                return node instanceof Element;
            }).map(convertNode);
        }
    };
}

function convertNodes(nodes) {
    return map.call(nodes, convertNode);
}

module.exports = function parseXML(xml) {
    var doc = parser.parseFromString(xml, 'application/xml');

    return function queryXML(selector) {
        return convertNodes(doc.querySelectorAll(selector));
    };
};
