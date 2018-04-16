import { h, Component } from 'preact';
// import { Text, Localizer, withText } from 'preact-i18n';
import { defaultProps, withProps } from 'recompose';
import GiphyThumbnail from '../giphy-thumbnail';
import JustifiedLayout from '../justified-layout';
import last from 'lodash/last';
import wire from 'wiretie';
import {
	THUMBS_PER_ROW,
	DEFAULT_TAGS,
	DEFAULT_SUGGESTED_TAGS
} from './constants';

function variedChunks(arr, minChunkSize = 2, maxChunkSize = 5) {
	function rand() {
		return Math.max(minChunkSize, Math.floor(Math.random() * maxChunkSize));
	}
	let nextChunkSize = rand();
	return arr.reduce((acc, current) => {
		let lastRow = last(acc);
		if (lastRow && lastRow.length < nextChunkSize) {
			return [
				...acc.slice(0, -1),
				[ ...lastRow, current ]
			];
		}

		nextChunkSize = rand();
		return [
			...acc,
			[ current ]
		];
	}, []);
}

@defaultProps({
	tags: '',
	// The method on giphyApiClient to retrieve gifs (search, trending, random)
	method: 'search',
	thumbsPerRow: THUMBS_PER_ROW,
	defaultTags: DEFAULT_TAGS,
	suggestedTags: DEFAULT_SUGGESTED_TAGS
})
@withProps(({ thumbsPerRow }) => ({
	numSuggestedThumbnails: 4 * thumbsPerRow,
	gifsPerPage: 5 * thumbsPerRow
}))
@wire('gifs', null, (gifClient) => ({ gifClient }))
export default class GiphyJustifiedLayout extends Component {
	state = {
		gifs: [],
		page: 0,
		hasMore: true,
		isFetchingData: false
	};

	counter = 0;

	loadMore = () => {
		let { gifClient, gifsPerPage, defaultTags, tags, method } = this.props,
			page = this.state.page + 1,
			offset = page * gifsPerPage,
			id = ++this.counter;

		this.setState({ isFetchingData: true });

		gifClient[method]({
			q: tags || defaultTags,
			offset,
			limit: gifsPerPage
		}).then( results => {
			// ignore outdated responses:
			if (this.counter!==id || !results) return;

			this.setState({
				page,
				isFetchingData: false,
				hasMore: results.pagination && results.pagination.total_count>=offset,
				gifs: this.state.gifs.concat(results.data)
			});
		}).catch((err) => { console.error('Oops, no more gifs!', err); return Promise.reject(err); }); // eslint-disable-line no-console
	};

	componentWillReceiveProps(nextProps) {
		if (nextProps.tags!==this.props.tags || nextProps.method !== this.props.method) {
			// invalidate any pending requests:
			this.counter++;

			this.setState({
				isFetchingData: false,
				page: 0,
				gifs: [],
				hasMore: true
			}, this.loadMore);
		}
	}

	renderRow = (row) => (
		<div>
			{row.map((gif) => (
				<GiphyThumbnail
					gif={gif}
					onClick={this.props.onClickGif}
				/>
			))}
		</div>
	)

	render(props, { gifs, isFetchingData, hasMore }) {
		return (
			<JustifiedLayout
				{...props}
				isFetchingData={isFetchingData}
				hasMore={hasMore}
				loadMore={this.loadMore}
				renderRow={this.renderRow}
				data={variedChunks(gifs)}
			/>
		);
	}
}

