export default function debounce(fn, delay) {
	let timer, ctx, args;
	function done() {
		fn.apply(ctx, args);
	}
	return function(...innerArgs) {
		ctx = this;
		args = innerArgs;
		clearTimeout(timer);
		timer = setTimeout(done, delay);
	};
}
