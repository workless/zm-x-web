/**
 * Create a cached instance of a function that calls a specific argument.  Useful in JSX to avoid
 * creating a new function call on each render.  You can optionally also pas
 *
 * @param {Function} fn fn to call when the return value is invoked
 * @param {*} [arg] Argument to pass to fn when it is invoked
 * @param {Boolean} [passCallingArgs=false] If true, any arguments passed to the cached function will be called as the last arguments to fn
 * @returns {Function} The cached function reference that will invoke fn with arg, and optionally the arguments sent to the cached function when called
 */
export function callWith(fn, arg, passCallingArgs) {
	if (!fn) return;
	let cache = fn.__callWithCache || (fn.__callWithCache = []);
	for (let i = cache.length; i--; ) {
		let cached = cache[i];
		if (cached.arg === arg) return cached.proxy;
	}
	let proxy = passCallingArgs ? (...rest) => fn(arg,...rest) : () => fn(arg);
	cache.push({ arg, proxy });
	return proxy;
}

