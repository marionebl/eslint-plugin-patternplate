import path from 'path';
import traverse from 'babel-traverse';
import {sync as json} from 'load-json-file';
import {sync as exists} from 'path-exists';

import parse from './parse';

export default process;

function process(text, filename) {
	const patternRoot = path.dirname(filename);
	const manifestPath = path.join(patternRoot, 'pattern.json');

	if (!exists(manifestPath)) {
		return [text];
	}

	const manifest = json(manifestPath);
	const {patterns = {}} = manifest;

	const rootPath = getPatternRoot(filename);
	const extension = path.extname(filename);

	if (!rootPath) {
		return [text];
	}

	const [err, ast] = parse(text);

	// let eslint handle invalid js
	if (err && err.loc) {
		return [text];
	}

	// throw other errors
	if (err && !err.loc) {
		return err;
	}

	const dependencySourceNodes = getDependencySourceNodes(ast);
	var result = text;
	var offset = 0;

	dependencySourceNodes.forEach(node => {
		const localName = node.value;

		if (localName === 'Pattern') {
			const demoGlobalName = extension === '.js' ? './' : `./index${extension}`;
			result = replaceSource(node, result, demoGlobalName, offset);
			offset += (demoGlobalName.length - localName.length);
			return;
		}

		const patternID = patterns[localName];

		if (!patternID) {
			return;
		}

		const targetPath = path.resolve(rootPath, patternID, extension === '.js' ? '' : `index${extension}`);
		const relativePath = path.relative(filename, targetPath);
		const globalName = relativePath.split(path.sep).slice(1).join('/');

		result = replaceSource(node, result, globalName, offset);
		offset += (globalName.length - localName.length);
	});

	return [result];
}

function replaceSource(node, text, value, offset) {
	const start = node.start + 1 + offset;
	const end = node.end - 1 + offset;
	return `${text.substr(0, start)}${value}${text.slice(end)}`;
}

function getPatternRoot(file) {
	const frags = file.split(path.sep);
	const pos = frags.lastIndexOf('patterns');

	if (pos === -1) {
		return null;
	}

	return frags.slice(0, pos + 1)
		.join(path.sep);
}

function getDependencySourceNodes(ast) {
	const nodes = [];

	traverse(ast, {
		enter(path) {
			if (path.type === 'ImportDeclaration') {
				nodes.push(path.node.source);
			}
			if (path.type === 'ExportDeclaration') {
				nodes.push(path.node.source);
			}
			if (path.type === 'CallExpression') {
				if (path.node.callee.name !== 'require') {
					return;
				}
				const [arg] = path.node.arguments;
				nodes.push(arg);
			}
		}
	});

	return nodes;
}
