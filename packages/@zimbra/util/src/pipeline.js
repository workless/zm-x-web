
/**
 * A functional implementation of the pipeline operator: https://github.com/gilbert/es-pipeline-operator
 * @param {Function[]} fns     a list of functions to be called in order, each one called with the result of the previous call.
 * @returns {Function}         returns one function which will invoke all the given functions in succession.
 * @example <caption>Add and multiply a number, then print it</caption>
 *
 * console.log(pipeline([
 *   (n) => n + 1,
 *   (n) => n * 2,
 *   (n) => 'Your number is: ' + n
 * ])(4))
 *
 * Output: "Your number is: 10"
 */
export default function pipeline(fns) {
	return (target) => fns.reduce(callNext, target);
}

function callNext(acc, next) {
	return next(acc);
}

