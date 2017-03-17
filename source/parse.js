import * as babylon from 'babylon';

export default parse;

const options = {
	sourceType: 'module',
	plugins: [
		'estree',
		'jsx',
		'flow',
		'doExpressions',
		'objectRestSpread',
		'classProperties',
		'exportExtensions',
		'asyncGenerators',
		'functionBind',
		'functionSent'
	]
};

function parse(source) {
	try {
		const ast = babylon.parse(source, options);
		return [null, ast];
	} catch (err) {
		return [err];
	}
}
