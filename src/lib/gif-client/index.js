import events from 'mitt';
import createGiphyClient from './giphy.com-client';

export default function gifClient(config = {}) {
	const api = events();

	// Giphy Integration!
	const giphyClient = createGiphyClient(config);

	api.getGifsByTag = giphyClient.search;

	return api;
}
