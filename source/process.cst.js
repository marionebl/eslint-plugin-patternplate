import path from 'path';
import {traverse} from 'estraverse';
import {Parser, Token, Node, visitorKeys} from 'cst';
import {sync as json} from 'load-json-file';
import {sync as exists} from 'path-exists';

export default process;

const parser = new Parser({
	languageExtensions: {
		jsx: true,
		flow: true
	}
});

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

	const cst = parser.parse(text);

	const dependencySourceNodes = getDependencySourceNodes(cst);

	dependencySourceNodes.forEach(node => {
		const localName = node.value;

		if (localName === 'Pattern') {
			const demoTarget = extension === '.js' ? './demo' : `demo${extension}`;
			const newNode = new Node('StringLiteral', [Token.createFromToken({
				type: 'String',
				value: demoTarget,
				sourceCode: node.getSourceCode().replace(localName, demoTarget)
			})]);
			node.parentElement.replaceChild(newNode, node);
			return;
		}

		const globalName = patterns[localName];

		if (!globalName) {
			return;
		}

		const targetPath = path.resolve(rootPath, globalName, extension === '.js' ? '' : `index${extension}`);
		const relativePath = path.relative(filename, targetPath);
		const source = relativePath.split(path.sep).slice(1).join('/');

		const newNode = new Node('StringLiteral', [Token.createFromToken({
			type: 'String',
			value: source,
			sourceCode: node.getSourceCode().replace(localName, source)
		})]);

		node.parentElement.replaceChild(newNode, node);
	});

	return [cst.getSourceCode()];
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
		enter(node) {
			if (node.type === 'ImportDeclaration') {
				nodes.push(node.source);
			}
			if (node.type === 'ExportDeclaration') {
				nodes.push(node.source);
			}
			if (node.type === 'CallExpression') {
				if (node.callee.name !== 'require') {
					return;
				}
				const [arg] = path.node.arguments;
				nodes.push(arg);
			}
		},
		keys: visitorKeys
	});

	return nodes;
}
