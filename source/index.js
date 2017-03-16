import process from './process';

export default {
	processors: {
		'.html': {preprocess, postprocess},
		'.js': {preprocess, postprocess},
		'.jsx': {preprocess, postprocess}
	}
};

function preprocess(text, filename) {
	return process(text, filename);
}

function postprocess(messages) {
	const [errors] = messages;
	return errors;
}
