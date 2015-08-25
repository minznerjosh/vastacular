'use strict';

function existy(value) {
    return value !== null && value !== undefined;
}

function escapeXML(string) {
    return string !== undefined ? String(string)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        : '';
}

function makeWhitespace(amount) {
    var result = '';

    while (amount--) {
        result += ' ';
    }

    return result;
}

function makeCDATA(text) {
    var parts = text !== undefined ? (function(text) {
        var result = [];
        var regex = (/]]>/g);

        var cursor = 0;
        var match, end;
        while (match = regex.exec(text)) {
            end = match.index + 2;

            result.push(match.input.substring(cursor, end));
            cursor = end;
        }
        result.push(text.substring(cursor, text.length));

        return result;
    }(String(text))) : [''];

    return parts.reduce(function(result, part) {
        return result + '<![CDATA[' + part + ']]>';
    }, '');
}

function nodeValue(node) {
    return node.cdata ? makeCDATA(node.value) : escapeXML(node.value);
}

function compileNode(node, indentation, trim) {
    var tag = node.tag;
    var attributes = node.attributes || {};
    var attributeNames = Object.keys(attributes);
    var children = node.children || [];
    var value = node.value;
    var hasChildren = children.length > 0;
    var hasAttributes = attributeNames.every(function(attribute) {
        return existy(attributes[attribute]);
    }) && attributeNames.length > 0;
    var hasValue = existy(value) || hasChildren || hasAttributes;

    var whitespace = makeWhitespace(indentation);
    var openingTag = '<' + tag + Object.keys(attributes).reduce(function(result, attribute) {
        if (trim && !existy(attributes[attribute])) { return result; }

        return result + ' ' + attribute + '="' + escapeXML(attributes[attribute]) + '"';
    }, '') + '>';
    var closingTag = '</' + tag + '>';

    if (trim && !hasValue && !node.required) {
        return [];
    }

    if (hasChildren) {
        return [
            whitespace + openingTag
        ].concat(node.children.reduce(function compileChild(result, child) {
            return result.concat(compileNode(child, indentation + 4, trim));
        }, []), [
            whitespace + closingTag
        ]);
    } else {
        return [
            whitespace + openingTag + nodeValue(node) + closingTag
        ];
    }
}

module.exports = function compileXML(data, trim) {
    return ['<?xml version="1.0" encoding="UTF-8"?>']
        .concat(compileNode(data, 0, trim))
        .join('\n');
};
