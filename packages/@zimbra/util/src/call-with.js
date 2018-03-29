
export function callWith(fn, arg) {
	if (!fn) return;
	let cache = fn.__callWithCache || (fn.__callWithCache = []);
	for (let i = cache.length; i--; ) {
		let cached = cache[i];
		if (cached.arg === arg) return cached.proxy;
	}
	let proxy = () => fn(arg);
	cache.push({ arg, proxy });
	return proxy;
}

