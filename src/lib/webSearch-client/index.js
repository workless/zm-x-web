import apiRequest from '../api-request';
import { queryToString } from '../util';

const API_KEY = '9f32c96a299f4454a411695fba899bfc'; // ¿Do not use in production?

export default function createwebSearcheClient(config = {}){
	let api = {};
	let options = {
		method: 'GET',
		headers: {
			'Ocp-Apim-Subscription-Key': API_KEY
		}
	};

	api.request = apiRequest(config.origin || 'https://api.cognitive.microsoft.com/bing/v7.0', undefined, undefined, { credentials: 'omit' });

	api.getWebSearchResults = function search(params) {
		return api.request(`/search?${queryToString(params)}`,undefined,options);
	};
	return api;
}