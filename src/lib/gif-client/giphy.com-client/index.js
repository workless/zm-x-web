import events from 'mitt';
import queryString from 'query-string';

const DEFAULT_API_KEY = 'b58857c39a604d2e98811978d53fe3a7'; // ¿Do not use in production?

// Visit {@link https://developers.giphy.com/docs/} for official documentation
export default function createGiphyClient(config = {}) {
	const apiKey = config.apiKey || DEFAULT_API_KEY;
	const api = events();

	function queryToString(params = {}) {
		if (typeof params === 'string') { return params; }

		params['api_key'] = apiKey;
		return queryString.stringify(params);
	}

	api.request = function request(endpoint, params) {
		return fetch(`https://api.giphy.com/v1${endpoint}?${queryToString(params)}`)
			.then((r) => {
				if (!r.ok) {
					return Promise.reject(Error('Bad Response: ' + r.status));
				}

				const isJson = r.headers.get('content-type') && r.headers.get('content-type').includes('application/json');
				return isJson
					? r.json()
					: r.text();
			});
	};

	/**
	 * Search for Gifs - see {@link https://developers.giphy.com/docs/#operation--gifs-search-get}
	 * @param {Object} params               Parameters to pass as query string to the api call
	 * @param {String} params.q           The search query
	 * @param {Number} [params.limit]       Maximum number of records to return. Defaults to 25
	 * @param {Number} [params.offset]      An optional results offset. Defaults to 0.
	 * @param {String} [params.rating]      Filters results by specified rating.
	 * @param {String} [params.lang]        Specify default country for regional content; use a 2-letter ISO 639-1 country code.
	 * @param {String} [params.fmt]         Used to indicate the expected response format. Default is Json.
	 * @returns {Promise}                   Promise resolves with a {@link https://developers.giphy.com/docs/#gif-object}
   */
	api.search = function search(params) {
		return api.request('/gifs/search', params);
	};

	/**
	 * The translate API draws on search, but uses the GIPHY special sauce to
	 * handle translating from one vocabulary to another. In this case, words and
	 * phrases to GIFs.
	 * @param {Object} params             Parameters to pass as query string to the api call
	 * @param {String} params.s           Search term
	 * @returns {Promise}                 Promise resolves with a {@link https://developers.giphy.com/docs/#gif-object}
	 */
	api.translate = function translate(params) {
		return api.request('/gifs/translate', params);
	};

	/**
	 * Fetch GIFs currently trending online. Hand curated by the GIPHY editorial
	 * team. The data returned mirrors the GIFs showcased on the GIPHY homepage.
	 * Returns 25 results by default.
	 * @param {Object} [params]             Parameters to pass as query string to the api call
	 * @param {Integer} [params.limit]      The maximum number of records to return.
	 * @param {String} [params.rating]      Filters results by specified rating.
	 * @param {String} [params.fmt]         Used to indicate the expected response format. Default is Json.
	 * @returns {Promise}                   Promise resolves with a {@link https://developers.giphy.com/docs/#gif-object}
	 */
	api.trending = function trending(params) {
		return api.request('/gifs/trending', params);
	};

	/**
	 * Returns a random GIF, limited by tag. Excluding the tag parameter will
	 * return a random GIF from the GIPHY catalog.
	 * @param {Object} [params]             Parameters to pass as query string to the api call
	 * @param {String} [params.tag]         Filters results by specified tag.
	 * @param {String} [params.rating]      Filters results by specified rating.
	 * @param {String} [params.fmt]         Used to indicate the expected response format. Default is Json.
	 * @returns {Promise}                   Promise resolves with a {@link https://developers.giphy.com/docs/#gif-object}
	 */
	api.random = function random(params) {
		return api.request('/gifs/random', params);
	};

	/**
	 * Returns a GIF given that GIF's unique ID
	 * @param {String|String[]} ids     The unique gif ID, or comma-seperated list of gif IDs, or Array of gif IDs
	 * @returns {Promise}               Promise resolves with a {@link https://developers.giphy.com/docs/#gif-object}
	 */
	api.gif = function gif(ids) {
		if (Array.isArray(ids)) { ids = ids.join(','); }
		return api.request(`/gifs/${ids}`);
	};

	return api;
}
