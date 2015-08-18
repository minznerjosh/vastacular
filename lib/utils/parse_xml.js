'use strict';

var cheerio = require('cheerio');
var map = Array.prototype.map;

module.exports = function parseXML(xml) {
    var $ = cheerio.load(xml, {
        xmlMode: true
    });

    function convertNode(node) {
        var $node = $(node);
        var hasChildren = $node.children().length > 0;

        return {
            tag: node.tagName,
            value: hasChildren ? null : $node.text(),
            attributes: $node.attr(),

            find: function find(selector) {
                return convertNodes($node.find(selector));
            },
            children: function children() {
                return convertNodes($node.children());
            }
        };
    }

    function convertNodes($node) {
        return map.call($node, convertNode);
    }

    return function queryXML(selector) {
        return convertNodes($(selector));
    };
};
