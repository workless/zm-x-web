import { h, Component } from 'preact';
import { Text } from 'preact-i18n';
import { Button } from '@zimbra/blocks';
import GiphyJustifiedLayout from '../giphy-justified-layout';
import SearchInput from '../search-input';
import style from './style';
import cx from 'classnames';

export default class ToolbarItemTooltip extends Component {
	handleSearch = (searchTerm) => {
		this.setState({ tags: searchTerm });
	}

	handleClickPopular = () => {
		this.setState({ tags: '' });
	}

	handleClickRecent = () => {
		this.setState({ tags: 'latest' });
	}

	render({ onClickGif, ...props }, { tags }) {
		return (
			<div {...props} class={cx(style.tooltip, props.class)}>
				<div class={style.searchBar}>
					<SearchInput
						value={tags}
						onSearch={this.handleSearch}
						class={style.searchInput}
					/>

					<span>
						<Button onClick={this.handleClickPopular}>
							<Text id="mediaConcierge.gifs.buttons.popular" />
						</Button>
						<Button onClick={this.handleClickRecent} styleType="primary">
							<Text id="mediaConcierge.gifs.buttons.recent" />
						</Button>
					</span>
				</div>

				<div class={style.content}>
					<GiphyJustifiedLayout
						onClickGif={onClickGif}
						tags={tags}
					/>
				</div>
			</div>
		);
	}
}
