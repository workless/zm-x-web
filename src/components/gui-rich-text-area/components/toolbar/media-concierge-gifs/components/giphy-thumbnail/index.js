import { h, Component } from 'preact';
import { connect } from 'preact-redux';
import Thumbnail from '../../../../../../thumbnail';
import { embed } from '../../../../../../../store/media-menu/actions';

@connect(null, { onEmbed: embed })
export default class GiphyGif extends Component {

	handleClick = (e) => {
		this.handleEmbed();
		this.props.onClick && this.props.onClick(e);
	}

	handleEmbed = () => {
		const { onEmbed, name, gif: { images } } = this.props;
		if (typeof onEmbed === 'function') {
			onEmbed([{
				contentType: 'image/gif',
				name,
				url: images.original.url
			}]);
		}
	}

	handleHover = (args) => {
		const { onHover, gif } = this.props;
		if (typeof onHover === 'function') {
			onHover(!args ? args : gif.images.original.url);
		}
	}

	render({ name, onEmbed, onHover, gif, ...props }) {
		const { images } = gif;
		const thumbnail = getGiphyPreviewUrl(gif);
		const { url } = images.original;

		return (
			<Thumbnail
				{...props}
				thumbnail={thumbnail}
				data={{ url, name: 'Gif from Giphy.com', contentType: 'image/gif' }}
				src={url}
				scrimProps={{ title: name }}
				onClick={this.handleClick}
				onHover={this.handleHover}
			/>
		);
	}
}

function getGiphyPreviewUrl(gif) {
	const images = gif && gif.images;
	return images.preview_gif.url || images.downsized_small.url || images.downsized.url || images.original.url;
}
