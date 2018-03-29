function debounce(fn, delay) {
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

export default function createKeyBuffer(opts = {}) {
	let keyPressBuffer = [];

	function clearKeyBuffer() {
		keyPressBuffer = [];
	}

	const delayClearKeyBuffer = debounce(clearKeyBuffer, opts.delay || 1000);


	return function keyBuffer(input) {
		keyPressBuffer.push(input);
		delayClearKeyBuffer();
		return keyPressBuffer;
	};
}
